import React, { useState, useRef } from 'react';
import { X, Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { Unit } from '../../types';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (units: Unit[], mode: 'override' | 'append') => void;
  existingUnits: Unit[];
  globalMinPricePerSqft?: number;
}

interface ImportedRow {
  floor: string;
  unit: string;
  planType: string;
  sqft: number;
  basePricePerSqft: number;
  orientation: string;
  outdoorSqft: number;
  bedrooms: number;
  bathrooms: number;
  basePrice: number;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingUnits,
  globalMinPricePerSqft = 1100
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [importMode, setImportMode] = useState<'override' | 'append'>('override');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ImportedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [step, setStep] = useState<'upload' | 'preview' | 'complete'>('upload');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const templateData = [
      {
        Floor: 'Garden',
        Unit: '101',
        'Plan Type': '1B',
        'Square Feet': 650,
        'Base Price Per SqFt': 1200,
        Orientation: 'NW',
        'Outdoor SqFt': 150,
        Bedrooms: 1,
        Bathrooms: 1,
        'Base Price': 780000
      },
      {
        Floor: 'Garden',
        Unit: '102',
        'Plan Type': '1B+D',
        'Square Feet': 750,
        'Base Price Per SqFt': 1180,
        Orientation: 'NE',
        'Outdoor SqFt': 200,
        Bedrooms: 1,
        Bathrooms: 1,
        'Base Price': 885000
      },
      {
        Floor: '3',
        Unit: '301',
        'Plan Type': '2B',
        'Square Feet': 950,
        'Base Price Per SqFt': 1200,
        Orientation: 'SE',
        'Outdoor SqFt': 100,
        Bedrooms: 2,
        Bathrooms: 2,
        'Base Price': 1140000
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Unit Data Template');
    XLSX.writeFile(wb, 'unit_data_template.xlsx');
  };

  const validateRow = (row: any, index: number): ImportedRow | null => {
    const errors: string[] = [];
    
    // Required fields validation
    if (!row.Floor && !row.floor) errors.push(`Row ${index + 2}: Floor is required`);
    if (!row.Unit && !row.unit) errors.push(`Row ${index + 2}: Unit is required`);
    if (!row['Plan Type'] && !row.planType && !row['plan type']) errors.push(`Row ${index + 2}: Plan Type is required`);
    
    // Numeric validation
    const sqft = Number(row['Square Feet'] || row.sqft || row['square feet']);
    const basePricePerSqftValue = row['Base Price Per SqFt'] || row.basePricePerSqft || row['base price per sqft'];
    const basePriceValue = row['Base Price'] || row.basePrice || row['base price'];
    
    let basePricePerSqft = basePricePerSqftValue ? Number(basePricePerSqftValue) : null;
    let basePrice = basePriceValue ? Number(basePriceValue) : null;
    
    const outdoorSqft = Number(row['Outdoor SqFt'] || row.outdoorSqft || row['outdoor sqft'] || 0);
    const bedrooms = Number(row.Bedrooms || row.bedrooms || 1);
    const bathrooms = Number(row.Bathrooms || row.bathrooms || 1);

    if (isNaN(sqft) || sqft <= 0) errors.push(`Row ${index + 2}: Invalid Square Feet`);
    
    // Handle missing base price fields
    if (!basePricePerSqft || isNaN(basePricePerSqft) || basePricePerSqft <= 0) {
      if (basePrice && !isNaN(basePrice) && basePrice > 0) {
        // Calculate price per sqft from base price
        basePricePerSqft = basePrice / sqft;
      } else {
        // Use global minimum price per sqft as default
        basePricePerSqft = globalMinPricePerSqft;
      }
    }
    
    if (!basePrice || isNaN(basePrice) || basePrice <= 0) {
      // Calculate base price from price per sqft
      basePrice = basePricePerSqft * sqft;
    }

    if (errors.length > 0) {
      setErrors(prev => [...prev, ...errors]);
      return null;
    }

    return {
      floor: String(row.Floor || row.floor),
      unit: String(row.Unit || row.unit),
      planType: String(row['Plan Type'] || row.planType || row['plan type']),
      sqft,
      basePricePerSqft,
      orientation: String(row.Orientation || row.orientation || 'N/A'),
      outdoorSqft,
      bedrooms,
      bathrooms,
      basePrice
    };
  };

  const parseFile = async (file: File) => {
    setErrors([]);
    const fileExtension = file.name.split('.').pop()?.toLowerCase();

    try {
      if (fileExtension === 'csv') {
        Papa.parse(file, {
          header: true,
          complete: (results) => {
            const validRows: ImportedRow[] = [];
            results.data.forEach((row: any, index: number) => {
              const validRow = validateRow(row, index);
              if (validRow) validRows.push(validRow);
            });
            setParsedData(validRows);
            setStep('preview');
          },
          error: (error) => {
            setErrors([`CSV parsing error: ${error.message}`]);
          }
        });
      } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const validRows: ImportedRow[] = [];
        jsonData.forEach((row: any, index: number) => {
          const validRow = validateRow(row, index);
          if (validRow) validRows.push(validRow);
        });
        setParsedData(validRows);
        setStep('preview');
      } else {
        setErrors(['Unsupported file format. Please use CSV or XLSX files.']);
      }
    } catch (error) {
      setErrors([`File parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`]);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      setFile(droppedFile);
      parseFile(droppedFile);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      parseFile(selectedFile);
    }
  };

  const handleImport = () => {
    const units: Unit[] = parsedData.map((row, index) => ({
      id: `${row.floor.toLowerCase()}-${row.unit}`,
      dbId: '', // Will be populated by database service after insertion
      floor: row.floor,
      unit: row.unit,
      planType: row.planType,
      sqft: row.sqft,
      basePricePerSqft: row.basePricePerSqft,
      orientation: row.orientation,
      outdoorSqft: row.outdoorSqft,
      bedrooms: row.bedrooms,
      bathrooms: row.bathrooms,
      basePrice: row.basePrice,
      finalPrice: row.basePrice,
      finalPricePerSqft: row.basePricePerSqft,
      premiums: []
    }));

    onImport(units, importMode);
    setStep('complete');
  };

  const resetModal = () => {
    setStep('upload');
    setFile(null);
    setParsedData([]);
    setErrors([]);
    setImportMode('override');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={handleClose} />
      
      <div className="absolute right-0 top-0 h-full w-full max-w-4xl bg-white shadow-xl">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Import Unit Data</h2>
              <p className="text-sm text-gray-500 mt-1">
                Import units from CSV or XLSX files
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {step === 'upload' && (
              <div className="space-y-6">
                {/* Template Download */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium text-blue-900">Need a template?</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        Download our template to see the required format and column headers.
                      </p>
                    </div>
                    <button
                      onClick={downloadTemplate}
                      className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      <span>Download Template</span>
                    </button>
                  </div>
                </div>

                {/* Import Mode Selection */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Import Mode</h3>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value="override"
                        checked={importMode === 'override'}
                        onChange={(e) => setImportMode(e.target.value as 'override' | 'append')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Override Baseline</span>
                        <p className="text-sm text-gray-500">Replace all existing units with imported data</p>
                      </div>
                    </label>
                    <label className="flex items-center space-x-3">
                      <input
                        type="radio"
                        value="append"
                        checked={importMode === 'append'}
                        onChange={(e) => setImportMode(e.target.value as 'override' | 'append')}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div>
                        <span className="font-medium text-gray-900">Append to Baseline</span>
                        <p className="text-sm text-gray-500">Add imported units to existing baseline data</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* File Upload */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-3">Upload File</h3>
                  <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                      dragActive 
                        ? 'border-blue-400 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Drop your file here, or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      Supports CSV and XLSX files up to 10MB
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.xlsx,.xls"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Choose File
                    </button>
                  </div>
                </div>

                {/* Errors */}
                {errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <h4 className="font-medium text-red-900">Import Errors</h4>
                    </div>
                    <ul className="text-sm text-red-700 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {step === 'preview' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">Preview Import Data</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {parsedData.length} units will be {importMode === 'override' ? 'replacing' : 'added to'} the baseline scenario
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setStep('upload')}
                      className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleImport}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Import {parsedData.length} Units
                    </button>
                  </div>
                </div>

                {/* Preview Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto max-h-96">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Floor</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bed/Bath</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SqFt</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Orientation</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base Price</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">$/SqFt</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {parsedData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {row.floor}-{row.unit}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.floor}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.planType}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {row.bedrooms}BR/{row.bathrooms}BA
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.sqft.toLocaleString()}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.orientation}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(row.basePrice)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{formatCurrency(row.basePricePerSqft)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {step === 'complete' && (
              <div className="text-center py-12">
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Import Complete!</h3>
                <p className="text-gray-500 mb-6">
                  Successfully imported {parsedData.length} units to the baseline scenario.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
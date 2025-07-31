
"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import axios from "axios";
import type { Item, SellerInfo, BuyerInfo, FormState, WithholdingForm, ReceiptKind, ReceiptKindsResponse } from "../../Component/types";
import SellerForm from "../../Component/Company/SellerForm";
import BuyerForm from "../../Component/Company/BuyerForm";
import ItemTable from "../../Component/local_Receipt_Forms/ItemTable";
import WithholdingFormComponent from "../../Component/local_Receipt_Forms/WithholdingForm";
import NoReceiptForms from "../../Component/local_Receipt_Forms/NoReceiptForms";
import ReceiptDetailsForm from "../../Component/local_Receipt_Forms/ReceiptDetailsForm";
import ProtectedRoute from "../Context/ProtectedRoute";
import { useAuth } from "../Context/AuthContext";
import Navigation from "../../Component/Navigation";
import FileUpload from "../../Component/local_Receipt_Forms/FileUpload";
import { BASE_URL } from "../../app/api/api";
import { Rowdies } from "next/font/google";

export default function LocalReceipt() {
  const { user, logout, token, isLoading } = useAuth();
  
  // Debug logging
  useEffect(() => {
    // console.log('LocalReceipt auth state:', { 
    //   hasUser: !!user, 
    //   hasToken: !!token, 
    //   isLoading,
    //   tokenValue: token ? `${token.substring(0, 20)}...` : 'no token'
    // });
  }, [user, token, isLoading]);

  const [form, setForm] = useState<FormState>({
    seller: { name: '', tin: '', address: '' },
    buyer: { name: '', tin: '', address: '' },
    receiptKind: '',
    receiptNumber: '',
    receiptDate: '',
    receiptType: '',
    receiptName: '',
    calendarType: '',
    receiptCategory: '',
    paymentMethod: '',
    bankName: '',
    itemType: '',
    items: [{ glAccount: '', nature: '', hsCode: '', itemCode: '', description: '', quantity: 1, unitCost: 0, totalCost: 0, unitOfMeasurement: '', category: '', reasonOfReceiving: '', taxType: '' }],
  });
  const [MainReceipt, setMainReceipt] = useState<File | null>(null);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showNoReceiptForms, setShowNoReceiptForms] = useState(false);
  const [noReceiptMode, setNoReceiptMode] = useState(false); // NEW STATE
  const [withholdingRequired, setWithholdingRequired] = useState<string>(''); 
  const [withholdingForm, setWithholdingForm] = useState<WithholdingForm>({
    receiptNumber: '',
    receiptDate: '',
    transactionType: '',
    subTotal: 0,
    taxWithholdingAmount: 0,
    salesInvoiceNumber: '',
    document: null,
  });
  const [receiptKinds, setReceiptKinds] = useState<string[]>([]);
  const [receiptNames, setReceiptNames] = useState<string[]>([]);
  const [receiptCategories, setReceiptCategories] = useState<string[]>([]);
  const [receiptTypes, setReceiptTypes] = useState<string[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<string[]>([]);
  const [bankNames, setBankNames] = useState<string[]>([]);
  
  // Store the full objects with IDs for backend submission
  const [receiptKindsData, setReceiptKindsData] = useState<any[]>([]);
  const [receiptNamesData, setReceiptNamesData] = useState<any[]>([]);
  const [receiptCategoriesData, setReceiptCategoriesData] = useState<any[]>([]);
  const [receiptTypesData, setReceiptTypesData] = useState<any[]>([]);
  const [paymentMethodsData, setPaymentMethodsData] = useState<any[]>([]);
  const [bankNamesData, setBankNamesData] = useState<any[]>([]);
  
  // State to track if fallback options are being used
  const [usingFallbackOptions, setUsingFallbackOptions] = useState({
    receiptCategories: false,
    receiptTypes: false,
    receiptKinds: false,
    receiptNames: false,
    paymentMethods: false,
    bankNames: false
  });

  // Memoized setter functions to prevent infinite re-renders
  const setSeller = useCallback((seller: SellerInfo) => {
    setForm(f => ({ ...f, seller }));
  }, []);

  const setBuyer = useCallback((buyer: BuyerInfo) => {
    setForm(f => ({ ...f, buyer }));
  }, []);

  // Initialize fallback options if arrays are empty after a delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (receiptCategories.length === 0) {
        setReceiptCategories(["Revenue", "Expense", "Crv", "Other"]);
        setUsingFallbackOptions(prev => ({ ...prev, receiptCategories: true }));
      }
      if (receiptTypes.length === 0) {
        setReceiptTypes(["Cash", "Credit"]);
        setUsingFallbackOptions(prev => ({ ...prev, receiptTypes: true }));
      }
      if (receiptKinds.length === 0) {
        setReceiptKinds(["Manual", "Electronic", "Digital"]);
        setUsingFallbackOptions(prev => ({ ...prev, receiptKinds: true }));
      }
      if (receiptNames.length === 0) {
        setReceiptNames(["VAT", "TOT", "Exempted", "ZERO", "Mixed"]);
        setUsingFallbackOptions(prev => ({ ...prev, receiptNames: true }));
      }
      if (paymentMethods.length === 0) {
        setPaymentMethods(["Cash", "Bank"]);
        setUsingFallbackOptions(prev => ({ ...prev, paymentMethods: true }));
      }
      if (bankNames.length === 0) {
        setBankNames(["Commercial Bank of Ethiopia", "Bank of Abyssinia", "Dashen Bank", "Awash Bank", "Hibret Bank"]);
        setUsingFallbackOptions(prev => ({ ...prev, bankNames: true }));
      }
    }, 3000); // Wait 3 seconds before showing fallback options

    return () => clearTimeout(timer);
  }, [receiptCategories.length, receiptTypes.length, receiptKinds.length, receiptNames.length, paymentMethods.length, bankNames.length]);

  // Fetch receipt categories
  useEffect(() => {
    if (!token) return; 
    
    const fetchReceiptCategories = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/receipt-categories`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.data && res.data.results && Array.isArray(res.data.results)) {
          // Store the full data objects
          setReceiptCategoriesData(res.data.results);
          // Extract the name field from each category object
          const categoryNames = res.data.results.map((category: any) => category.name);
          setReceiptCategories(categoryNames);
          
          // Debug: Log the receipt categories with their IDs
          console.log('Receipt Categories with IDs:', res.data.results);
        }
      } catch (err) {
        console.error('Error fetching receipt categories:', err);
        setReceiptCategories(["Revenue", "Expense", "Crv", "Other"]); // fallback
        setUsingFallbackOptions(prev => ({ ...prev, receiptCategories: true }));
      }
    };
    fetchReceiptCategories();
  }, [token]);

  // Fetch receipt types
  useEffect(() => {
    if (!token) return; // Don't make API calls if no token
    
    const fetchReceiptTypes = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/receipt_types`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.data && res.data.results && Array.isArray(res.data.results)) {
          // Store the full data objects
          setReceiptTypesData(res.data.results);
          // Extract the name field from each category object
          const receiptTypes = res.data.results.map((receiptType: any) => receiptType.name);
          setReceiptTypes(receiptTypes);
          
          // Debug: Log the receipt types with their IDs
          console.log('Receipt Types with IDs:', res.data.results);
        } 
      } catch (err) {
        console.error('Error fetching receipt types:', err);
        setReceiptTypes(["Cash", "Credit"]); // fallback
        setUsingFallbackOptions(prev => ({ ...prev, receiptTypes: true }));
      }
    };
    fetchReceiptTypes();
  }, [token]);

  // Fetch receipt kinds
  useEffect(() => {
    if (!token) return; // Don't make API calls if no token
    
    const fetchReceiptKinds = async () => {
      try {
        const res = await axios.get<ReceiptKindsResponse>(`${BASE_URL}/receipt-kinds`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }); 
        if (res.data && res.data.results && Array.isArray(res.data.results)) {
          // Store the full data objects
          setReceiptKindsData(res.data.results);
          const receiptKinds = res.data.results.map((receiptKind: any) => receiptKind.name);
          setReceiptKinds(receiptKinds);
          
          // Debug: Log the receipt kinds with their IDs
          console.log('Receipt Kinds with IDs:', res.data.results);
          console.log('Receipt Kinds names:', receiptKinds);
        }
      } catch (err) {
        console.error('Error fetching receipt kinds:', err);
        setReceiptKinds(["Manual", "Electronic", "Digital"]); // fallback
        setUsingFallbackOptions(prev => ({ ...prev, receiptKinds: true }));
      }
    };
    fetchReceiptKinds();
  }, [token]);

  // Fetch receipt names
  useEffect(() => {
    if (!token) return; // Don't make API calls if no token
    
    const fetchReceiptNames = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/receipt-names`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.data && res.data.results && Array.isArray(res.data.results)) {
          // Store the full data objects
          setReceiptNamesData(res.data.results);
          // Extract the name field from each category object
          const receiptNames = res.data.results.map((receiptName: any) => receiptName.name);
          setReceiptNames(receiptNames);
          
          // Debug: Log the receipt names with their IDs
          console.log('Receipt Names with IDs:', res.data.results);
        }
      } catch (err) {
        console.error('Error fetching receipt names:', err);
        setReceiptNames(["VAT", "TOT", "Exempted", "Mixed"]); // fallback
        setUsingFallbackOptions(prev => ({ ...prev, receiptNames: true }));
      }
    };
    fetchReceiptNames();
  }, [token]);

  //fetch payment methods
  useEffect(() => {
    if (!token) return; // Don't make API calls if no token
    
    const fetchPaymentMethods = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/payment-method-types`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.data && res.data.results && Array.isArray(res.data.results)) {
          // Store the full data objects
          setPaymentMethodsData(res.data.results);
          const paymentMethods = res.data.results.map((paymentMethod: any) => paymentMethod.method);
          setPaymentMethods(paymentMethods);
          
          // Debug: Log the payment methods with their IDs
          console.log('Payment Methods with IDs:', res.data.results);
        }
      } catch (err) {
        console.error('Error fetching payment methods:', err);
        setPaymentMethods(["Cash", "Bank Transfer", "Check", "Credit Card"]); // fallback
        setUsingFallbackOptions(prev => ({ ...prev, paymentMethods: true }));
      }
    };
    fetchPaymentMethods();
  }, [token]);

  //fetch bank names
  useEffect(() => {
    if (!token) return; // Don't make API calls if no token
    
    const fetchBankNames = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/bank-names`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        if (res.data && res.data.results && Array.isArray(res.data.results)) {
          // Store the full data objects
          setBankNamesData(res.data.results);
          const bankNames = res.data.results.map((bankName: any) => bankName.bank_name);
          setBankNames(bankNames);
          
                    // Debug: Log the bank names with their IDs
          console.log('Bank Names with IDs:', res.data.results);
        }
      } catch (err) {
        console.error('Error fetching bank names:', err);
        setBankNames(["Commercial Bank of Ethiopia", "Bank of Abyssinia", "Dashen Bank", "Awash Bank", "United Bank"]); // fallback
        setUsingFallbackOptions(prev => ({ ...prev, bankNames: true }));
      }
    };
    fetchBankNames();
  }, [token]);

  // Reset withholding form when receipt category changes to CRV
  useEffect(() => {
    if (form.receiptCategory === 'Crv') {
      setWithholdingRequired('');
      setWithholdingForm({
        receiptNumber: '',
        receiptDate: '',
        transactionType: '',
        subTotal: 0,
        taxWithholdingAmount: 0,
        salesInvoiceNumber: '',
        document: null,
      });
    }
  }, [form.receiptCategory]);

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Handle item changes
  const handleItemChange = (idx: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const items = [...prev.items];
      
      // Handle string fields
      if (['glAccount', 'nature', 'hsCode', 'itemCode', 'description', 'category', 'reasonOfReceiving', 'taxType', 'unitOfMeasurement'].includes(name)) {
        (items[idx] as any)[name] = value;
      } 
      // Handle numeric fields
      else if (name === 'unitCost') {
        const numericValue = value === '' ? 0 : parseFloat(value) || 0;
        items[idx].unitCost = numericValue;
      } 
      else if (name === 'quantity') {
        const numericValue = value === '' ? 0 : parseInt(value) || 0;
        items[idx].quantity = numericValue;
      }
      
      // Calculate totalCost based on receipt category
      if (prev.receiptCategory === 'Crv') {
        // For CRV, the amount (unitCost) is directly the total cost
        items[idx].totalCost = items[idx].unitCost || 0;
      } else {
        // For other categories, calculate as quantity * unitCost
        items[idx].totalCost = (items[idx].quantity || 0) * (items[idx].unitCost || 0);
      }
      
      return { ...prev, items };
    });
  };

  // Add new item row
  const addItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [...prev.items, { glAccount: '', nature: '', hsCode: '', itemCode: '', description: '', quantity: 1, unitCost: 0, totalCost: 0, unitOfMeasurement: '', category: '', reasonOfReceiving: '', taxType: '' }],
    }));
  };

  // Remove item row
  const removeItem = (idx: number) => {
    setForm((prev) => {
      const items = prev.items.filter((_, i) => i !== idx);
      return { ...prev, items };
    });
  };

  // Handle main receipt upload
  const handleMainReceiptChange = useCallback((file: File | null) => {
    setMainReceipt(file);
  }, []);

  // Handle attachment upload
  const handleAttachmentChange = useCallback((file: File | null) => {
    setAttachment(file);
  }, []);

  // Calculate totals with tax logic
  const subTotal = form.items.reduce((sum, item) => sum + item.totalCost, 0);
  
  // Tax calculation based on Receipt Name and item type
  const calculateTax = () => {
    // No tax calculation for CRV
    if (form.receiptCategory === 'Crv') {
      return 0;
    }
    
    if (form.receiptName === 'VAT') {
      return subTotal * 0.15; // 15% VAT
    } else if (form.receiptName === 'EXEMPTED') {
      return 0; // No tax for exempted
    } else if (form.receiptName === 'TOT') {
      if (form.itemType === 'goods') {
        return subTotal * 0.02; // 2% TOT for goods
      } else if (form.itemType === 'service') {
        return subTotal * 0.1; // 10% TOT for services
      }
    } else if (form.receiptName === 'MIXED') {
      // For mixed receipts, calculate tax based on each item's tax type
      return form.items.reduce((totalTax, item) => {
        if (item.taxType === 'VAT') {
          return totalTax + (item.totalCost * 0.15);
        } else if (item.taxType === 'TOT') {
          if (form.itemType === 'goods') {
            return totalTax + (item.totalCost * 0.02);
          } else if (form.itemType === 'service') {
            return totalTax + (item.totalCost * 0.1);
          }
        } else if (item.taxType === 'EXEMPTED') {
          return totalTax; // No tax for exempted items
        }
        return totalTax;
      }, 0);
    }
    return 0; // Default case
  };
  
  const tax = calculateTax();

  // Withholding logic - CRV receipts don't have withholding
  const shouldShowWithholdingDropdown =
    (form.receiptCategory === 'Revenue' || form.receiptCategory === 'Expense' || form.receiptCategory === 'Other') &&
    form.receiptName && form.itemType &&
    ((form.itemType === 'goods' && subTotal > 10000) || (form.itemType === 'service' && subTotal > 3000));

  // Withholding form handlers
  const handleWithholdingChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setWithholdingForm((prev) => ({
      ...prev,
      [name]: name === 'subTotal' || name === 'taxWithholdingAmount' ? Number(value) : value,
    }));
  }, []);
  
  const handleWithholdingFile = useCallback((file: File | null) => {
    setWithholdingForm((prev) => ({ ...prev, document: file }));
  }, []);

  // Auto-populate withholding form when it becomes active
  useEffect(() => {
    if (withholdingRequired === 'yes') {
      setWithholdingForm(prev => ({
        ...prev,
        salesInvoiceNumber: form.receiptNumber,
        subTotal: subTotal,
        taxWithholdingAmount: subTotal * 0.03, // 3% withholding
      }));
    }
  }, [withholdingRequired, form.receiptNumber, subTotal]);

  // Helper functions to find IDs by name
  const findIdByName = (dataArray: any[], name: string, fieldName: string = 'name'): number | null => {
    const item = dataArray.find(item => item[fieldName] === name);
    return item ? item.id : null;
  };
  // Handle form submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log('Form submission started');
    console.log('Form data:', form);
    console.log('Main receipt:', MainReceipt);
    console.log('Attachment:', attachment);
    console.log('Token:', token ? 'Present' : 'Missing');
    
    // Check for required fields
    const missingFields = [];
    if (!form.seller.name) missingFields.push('Seller Name');
    if (!form.seller.tin) missingFields.push('Seller TIN');
    if (!form.seller.address) missingFields.push('Seller Address');
    if (!form.buyer.name) missingFields.push('Buyer Name');
    if (!form.buyer.tin) missingFields.push('Buyer TIN');
    if (!form.buyer.address) missingFields.push('Buyer Address');
    if (!form.receiptCategory) missingFields.push('Receipt Category');
    if (!form.receiptType) missingFields.push('Receipt Type');
    if (!form.receiptKind) missingFields.push('Receipt Kind');
    if (!form.receiptName) missingFields.push('Receipt Name');
    if (!form.receiptNumber) missingFields.push('Receipt Number');
    if (!form.calendarType) missingFields.push('Calendar Type');
    if (!form.receiptDate) missingFields.push('Receipt Date');
    if (!form.paymentMethod) missingFields.push('Payment Method');
    
    // Check if items are required and filled
    if ((form.receiptCategory === 'Revenue' || form.receiptCategory === 'Expense' || form.receiptCategory === 'Other' || form.receiptCategory === 'Other') && 
        (!form.itemType || form.items.length === 0 || form.items.some(item => !item.description || item.totalCost === 0))) {
      missingFields.push('Item details (description and amount required)');
    }
    
    // Check if bank name is required for bank payment
    if (form.paymentMethod && form.paymentMethod.toLowerCase().includes('bank') && !form.bankName) {
      missingFields.push('Bank Name (required for bank payment)');
    }
    
    // Check if withholding form is required and filled
    if (shouldShowWithholdingDropdown && withholdingRequired === 'yes') {
      if (!withholdingForm.receiptNumber) missingFields.push('Withholding Receipt Number');
      if (!withholdingForm.receiptDate) missingFields.push('Withholding Receipt Date');
      if (!withholdingForm.transactionType) missingFields.push('Withholding Transaction Type');
    }
    
    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      setError(`Please fill in all required fields: ${missingFields.join(', ')}`);
      setSubmitting(false);
      return;
    }
    
    console.log('All required fields are filled, proceeding with submission...');
    setSubmitting(true);
    setError("");
    setSuccess("");
    let receiptSuccess = false;
    let withholdingSuccess = false;
    
    try {
      console.log('Validating form data...');
      console.log('Receipt category:', form.receiptCategory);
      console.log('Receipt kind:', form.receiptKind);
      console.log('Receipt type:', form.receiptType);
      console.log('Receipt name:', form.receiptName);
      console.log('Payment method:', form.paymentMethod);
      
      // Validate that all required IDs are found
      const categoryId = findIdByName(receiptCategoriesData, form.receiptCategory);
      const kindId = findIdByName(receiptKindsData, form.receiptKind);
      const typeId = findIdByName(receiptTypesData, form.receiptType);
      const nameId = findIdByName(receiptNamesData, form.receiptName);
      const methodId = findIdByName(paymentMethodsData, form.paymentMethod, 'method');
      const bankNameId = form.bankName ? findIdByName(bankNamesData, form.bankName, 'bank_name') : null;
      
      console.log('Found IDs:', {
        categoryId,
        kindId,
        typeId,
        nameId,
        methodId,
        bankNameId
      });

      // Build dynamic error message for missing data
      const missingData = [];
      if (!categoryId) missingData.push(`Receipt Category: "${form.receiptCategory}"`);
      if (!kindId) missingData.push(`Receipt Kind: "${form.receiptKind}"`);
      if (!typeId) missingData.push(`Receipt Type: "${form.receiptType}"`);
      if (!nameId) missingData.push(`Receipt Name: "${form.receiptName}"`);
      if (!methodId) missingData.push(`Payment Method: "${form.paymentMethod}"`);

      if (missingData.length > 0) {
        setError(`The following data could not be found: ${missingData.join(', ')}. Please refresh the page and try again.`);
        setSubmitting(false);
        return;
      }

      // Prepare data in the format expected by backend
      const receiptData = {
        receipt_number: form.receiptNumber,
        calendar_type: form.calendarType,
        receipt_date: form.receiptDate,
        receipt_catagory: categoryId,
        receipt_kind: kindId,
        receipt_type: typeId,
        receipt_name: nameId,
        subtotal: subTotal,
        tax: tax,
        total: subTotal + tax,
        withholding_applicable: withholdingRequired || "no",
        tin_number: form.seller.tin,
        buyer: {
          tin_number: form.buyer.tin,
          name: form.buyer.name,
          address: form.buyer.address
        },
        payment_method: methodId,
        bank_name: form.bankName || ""
      };

      console.log('Prepared receipt data:', receiptData);

      // Submit receipt data
   
      const receiptResponse = await axios.post(`${BASE_URL}/create-receipts`, receiptData, {
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
      });
    

      // Submit items data if there are items
      
      if (form.items && form.items.length > 0) {
        if (form.receiptCategory === 'Crv') {
          // CRV
          const crvItemsData = form.items.map(item => ({
            gl_account: item.glAccount,
            nature: item.nature,
            quantity: item.quantity,
            amount: item.unitCost, // For CRV, unitCost represents the amount
            total_amount: item.totalCost,
            reason_of_receiving: item.reasonOfReceiving,
            item_type: form.itemType,
            receipt_number: form.receiptNumber,
            
          }));

          console.log('Submitting CRV items data:', crvItemsData);
          console.log('CRV API URL:', `${BASE_URL}/create-crv`);
          console.log('Making API request to create-crv...');
          const crvResponse = await axios.post(`${BASE_URL}/create-crv`, crvItemsData, {
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
          });
          console.log('CRV submission response:', crvResponse.data);
          console.log('CRV submission successful!');
        } else {
          // Regular items for Revenue, Expense, Other 
          const regularItemsData = form.items.map(item => ({
            gl_account: item.glAccount,
            nature: item.nature,
            hs_code: item.hsCode,
            item_code: item.itemCode,
            item_type: form.itemType,
            item_description: item.description,
            unit_of_measurement: item.unitOfMeasurement,
            unit_cost: item.unitCost,
            quantity: item.quantity,
            raw_total_amount_before_tax: item.totalCost,
            receipt_number: form.receiptNumber,
           
          }));
        
          const itemsResponse = await axios.post(`${BASE_URL}/create-item`, regularItemsData, {
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json"
            },
          });
          console.log('Items submission response:', itemsResponse.data);
          console.log('Items submission successful!');
        }
      }

      receiptSuccess = true;

      // Handle file uploads if present
      if (MainReceipt || attachment) {
        try {
          console.log('Starting file upload...');
          console.log('Main receipt:', MainReceipt);
          console.log('Attachment:', attachment);
          
          const fileFormData = new FormData();
          if (MainReceipt) {
            fileFormData.append("MainReceipt", MainReceipt);
            console.log('Added mainReceipt to FormData');
          }
          if (attachment) {
            fileFormData.append("attachment", attachment);
            console.log('Added attachment to FormData');
          }
          
          // Include seller and buyer TIN numbers and receipt number as individual form fields
          fileFormData.append("receipt_number", form.receiptNumber);
          fileFormData.append("seller_tin_number", form.seller.tin);
          fileFormData.append("buyer_tin_number", form.buyer.tin);
          
          console.log('FormData contents:');
          for (let [key, value] of fileFormData.entries()) {
            console.log(`${key}:`, value);
          }
          
          console.log('Sending file upload request to:', `${BASE_URL}/upload-receipt-documents`);
          console.log('Making API request to upload-receipt-documents...');
          const uploadResponse = await axios.post(`${BASE_URL}/upload-receipt-documents`, fileFormData, {
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Content-Type": "multipart/form-data"
            },
          });
          console.log('File upload response:', uploadResponse.data);
          console.log('File upload successful!');
        } catch (uploadError) {
          console.error('File upload error:', uploadError);
          setError("Receipt submitted successfully, but failed to upload documents. Please try again.");
          setSubmitting(false);
          return;
        }
      } else {
        console.log('No files to upload');
      }

      // If withholding is required and selected, submit withholding form
      if (shouldShowWithholdingDropdown && withholdingRequired === 'yes') {
        try {
          const withholdingFormData = new FormData();
          
          // Add withholding form fields
          withholdingFormData.append('withholding_receipt_number', withholdingForm.receiptNumber);
          withholdingFormData.append('withholding_receipt_date', withholdingForm.receiptDate);
          withholdingFormData.append('transaction_description', withholdingForm.transactionType);
          withholdingFormData.append('sub_total', String(withholdingForm.subTotal));
          withholdingFormData.append('tax_withholding_amount', String(withholdingForm.taxWithholdingAmount));
          withholdingFormData.append('sales_invoice_number', withholdingForm.salesInvoiceNumber);
          
          // Add buyer and seller tin
          withholdingFormData.append('buyer_tin', form.buyer.tin);
          withholdingFormData.append('seller_tin', form.seller.tin);
          
          // Add main receipt number for reference
          withholdingFormData.append('main_receipt_number', form.receiptNumber);
          
          // Add withholding document if present
          if (withholdingForm.document) {
            withholdingFormData.append('withholding_document', withholdingForm.document);
          }
          await axios.post(`${BASE_URL}/withholding-receipts`, withholdingFormData, {
            headers: { 
              "Authorization": `Bearer ${token}`,
              "Content-Type": "multipart/form-data"
            },
          });
          withholdingSuccess = true;
        } catch (err) {
          console.error('Withholding submission error:', err);
          setError("Receipt submitted successfully, but failed to submit withholding receipt. Please try again.");
          setSubmitting(false);
          return;
        }
      } else {
        withholdingSuccess = true;
      }

      // If both succeed
      if (receiptSuccess && withholdingSuccess) {
        console.log('All submissions completed successfully!');
        setSuccess("Receipt submitted successfully!");
        setForm({
          seller: { name: '', tin: '', address: '' },
          buyer: { name: '', tin: '', address: '' },
          receiptKind: '',
          receiptNumber: '',
          receiptDate: '',
          receiptType: '',
          receiptName: '',
          calendarType: '',
          receiptCategory: '',
          paymentMethod: '',
          bankName: '',
          itemType: '',
          items: [{ glAccount: '', nature: '', hsCode: '', itemCode: '', description: '', quantity: 1, unitCost: 0, totalCost: 0, unitOfMeasurement: '', category: '', reasonOfReceiving: '', taxType: '' }],
        });
        setMainReceipt(null);
        setAttachment(null);
        setWithholdingRequired('');
        setWithholdingForm({
          receiptNumber: '',
          receiptDate: '',
          transactionType: '',
          subTotal: 0,
          taxWithholdingAmount: 0,
          salesInvoiceNumber: '',
          document: null,
        });
      }
    } catch (err) {
      console.error('Submission error:', err);
      console.error('Error details:', {
        message: err instanceof Error ? err.message : 'Unknown error',
        response: (err as any)?.response?.data,
        status: (err as any)?.response?.status,
        statusText: (err as any)?.response?.statusText
      });
      setError("Failed to submit receipt. Please try again.");
    } finally {
      console.log('Form submission process completed');
      setSubmitting(false);
    }
  };

  return (
    // <ProtectedRoute>
      <div>
        <Navigation />
      <form onSubmit={(e) => {
        console.log('Form onSubmit triggered!');
        handleSubmit(e);
      }}>
        <div className="max-w-5xl mx-auto bg-white rounded-3xl shadow-2xl p-10 mt-12 border border-gray-100">
      {/* Header with title */}
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <span className="text-3xl font-bold text-gray-800">Receipt Entry</span>
        </div>
        {/* <span className="text-xs text-gray-400 font-semibold">Fiscal Year: 2024-2025</span> */}
      </div>


      {/* No Receipt Button */}
      <div className="mb-6 flex justify-end gap-4">
        <button
          type="button"
          className="px-5 py-2 rounded-lg bg-yellow-100 text-yellow-800 font-semibold border border-yellow-300 shadow hover:bg-yellow-200 transition"
          onClick={() => setNoReceiptMode((v) => !v)}
        >
          {noReceiptMode ? "Back to normal receipt entry" : "If the seller has no receipt, click here."}
        </button>
      </div>

      {/* NO RECEIPT MODE: Only show Purchase Voucher and 30% withholding forms */}
      {noReceiptMode ? (
        <NoReceiptForms submitting={submitting} />
      ) : (
        <>
          {/* Seller & Buyer Info Side-by-Side */}
          <div className="flex flex-col md:flex-row gap-8 mb-10">
            <SellerForm 
              seller={form.seller} 
              setSeller={setSeller} 
              allowOverride={true}
            />
            <BuyerForm buyer={form.buyer} setBuyer={setBuyer} />
          </div>

          {/* Receipt Kind, Name, Type, Number, Date, Calendar, Category */}
          <ReceiptDetailsForm
            form={form}
            setForm={setForm}
            receiptKinds={receiptKinds}
            receiptNames={receiptNames}
            receiptCategories={receiptCategories}
            receiptTypes={receiptTypes}
          />

          {/* Item Type Selection - Always Visible */}
          {(form.receiptCategory === 'Revenue' || form.receiptCategory === 'Expense' || form.receiptCategory === 'Crv' || form.receiptCategory === 'Other') && (
            <div className="flex items-center gap-4 mb-4">
              <label className="font-semibold text-gray-700">Item Type*</label>
              <select
                className="input input-bordered px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40"
                name="itemType"
                value={form.itemType}
                onChange={e => setForm(f => ({ ...f, itemType: e.target.value }))}
                required
              >
                <option value="">Select</option>
                <option value="goods">Goods</option>
                <option value="service">Service</option>
              </select>
            </div>
          )}



          {/* Validation Message for Item Table */}
          {(form.receiptCategory === 'Revenue' || form.receiptCategory === 'Expense' || form.receiptCategory === 'Crv' || form.receiptCategory === 'Other') && 
           (!form.receiptName || !form.itemType) && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-yellow-800 font-medium">
                  {!form.receiptName && !form.itemType 
                    ? "Please select Receipt Name and Item Type to proceed with item entry."
                    : !form.receiptName 
                    ? "Please select Receipt Name to proceed with item entry."
                    : "Please select Item Type to proceed with item entry."
                  }
                </span>
              </div>
            </div>
          )}

          {/* Item Management Table for different receipt categories */}
          {(form.receiptCategory === 'Revenue' || form.receiptCategory === 'Expense' || form.receiptCategory === 'Crv' || form.receiptCategory === 'Other') && 
           form.receiptName && form.itemType && (
            <ItemTable
              items={form.items}
              handleItemChange={handleItemChange}
              addItem={addItem}
              removeItem={removeItem}
              receiptCategory={form.receiptCategory}
              receiptName={form.receiptName}
              itemType={form.itemType}
              subTotal={subTotal}
              tax={tax}
              total={subTotal + tax}
            />
          )}

       

          {/* Payment Method & Upload Document */}
          <div className="space-y-6 mb-6">
            {/* Payment Method Section */}
            <div className="flex flex-col md:flex-row gap-6 items-end">
              <div className="flex flex-col">
                <label className="mb-1 font-semibold text-gray-700">Payment Method</label>
                <select className="input input-bordered px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40" name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
                  <option value="">Select Payment Method</option>
                  {paymentMethods.map((method, index) => (
                    <option key={index} value={method}>{method}</option>
                  ))}
                </select>
              </div>
              {form.paymentMethod && form.paymentMethod.toLowerCase().includes('bank') && (
                <div className="flex flex-col">
                  <label className="mb-1 font-semibold text-gray-700">Bank Name</label>
                  <select 
                    className="input input-bordered px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-40" 
                    name="bankName" 
                    value={form.bankName} 
                    onChange={handleChange}
                  >
                    <option value="">Select Bank</option>
                    {bankNames.map((bankName, index) => (
                      <option key={index} value={bankName}>{bankName}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* File Upload Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FileUpload
                label="Upload Receipt"
                accept="image/*,.pdf"
                onChange={handleMainReceiptChange}
                value={MainReceipt}
                maxSize={10}
                required={false}
              />
              <FileUpload
                label="Upload Attachment"
                accept="image/*,.pdf"
                onChange={handleAttachmentChange}
                value={attachment}
                maxSize={10}
                required={false}
              />
            </div>
          </div>

        

          {/* Withholding Dropdown and Form - moved above submit button */}
          {shouldShowWithholdingDropdown && form.receiptName && form.itemType && (
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <label className="font-semibold text-gray-700">Does the receipt has Withholding?</label>
                <select
                  className="input input-bordered px-3 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-32"
                  value={withholdingRequired}
                  onChange={e => setWithholdingRequired(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </div>
              {withholdingRequired === 'yes' && (
                <WithholdingFormComponent
                  withholdingForm={withholdingForm}
                  setWithholdingForm={setWithholdingForm}
                  subTotal={subTotal}
                  taxWithholdingAmount={subTotal * 0.03}
                  handleWithholdingChange={handleWithholdingChange}
                  handleWithholdingFile={handleWithholdingFile}
                  buyer={form.buyer}
                  seller={form.seller}
                />
              )}
            </div>
          )}

          {/* Only one submit button for both forms, now conditionally below withholding form if enabled */}
          {(!shouldShowWithholdingDropdown || withholdingRequired !== 'yes') && (
            <div className="flex justify-end mb-4">
              <button 
                type="submit" 
                className="btn btn-success w-full md:w-auto px-8 py-3 rounded-lg text-lg font-bold shadow transition hover:scale-105 disabled:opacity-60" 
                disabled={submitting}
                onClick={() => console.log('Submit button clicked!')}
              >
                {submitting ? "Submitting..." : "Submit"}
              </button>
            </div>
          )}
          {error && <div className="text-red-600 bg-red-100 rounded px-3 py-2 text-center mb-2 font-semibold">{error}</div>}
          {success && <div className="text-green-700 bg-green-100 rounded px-3 py-2 text-center mb-2 font-semibold">{success}</div>}
          {/* If withholding form is enabled, show submit button below it */}
          {shouldShowWithholdingDropdown && withholdingRequired === 'yes' && (
            <div className="flex justify-end mb-4">
              <button 
                type="submit" 
                className="btn btn-success w-full md:w-auto px-8 py-3 rounded-lg text-lg font-bold shadow transition hover:scale-105 disabled:opacity-60" 
                disabled={submitting}
                onClick={() => console.log('Submit Receipt button clicked!')}
              >
                {submitting ? "Submitting..." : "Submit Receipt"}
              </button>
            </div>
          )}
        </>
      )}
        </div>
      </form>
      </div>
    // </ProtectedRoute>
  );
}
import { UiSchema } from '@/types';

/**
 * Generate a PDF using the new React PDF engine
 * @param data - The JSON data to render as PDF
 * @param ui - Optional UI schema for customizing the layout
 * @param title - Optional title for the PDF document
 * @returns Promise that resolves when download starts
 */
export async function generateReactPdf(
  data: any, 
  ui?: UiSchema, 
  title?: string
): Promise<void> {
  try {
    const response = await fetch("/api/pdf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data, ui, title })
    });

    if (!response.ok) {
      throw new Error(`PDF generation failed: ${response.statusText}`);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (title?.toLowerCase().replace(/\s+/g, "-") || "document") + ".pdf";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('React PDF generation error:', error);
    throw error;
  }
}

/**
 * Helper function to create common UI schemas for different data types
 */
export const createCommonUiSchemas = {
  /**
   * Invoice-specific UI schema
   */
  invoice: (): UiSchema => ({
    labels: {
      "$.invoice_number": "Invoice #",
      "$.invoice_date": "Date",
      "$.due_date": "Due Date",
      "$.subtotal": "Subtotal",
      "$.tax_amount": "Tax",
      "$.total_amount": "Total",
      "$.line_items": "Items",
      "$.customer": "Bill To",
      "$.vendor": "From"
    },
    format: {
      "$.invoice_date": "date:MMM DD, YYYY",
      "$.due_date": "date:MMM DD, YYYY",
      "$.subtotal": "currency",
      "$.tax_amount": "currency",
      "$.total_amount": "currency",
      "$.line_items.*.unit_price": "currency",
      "$.line_items.*.total": "currency"
    },
    as: {
      "$.line_items": "table"
    },
    tableCols: {
      "$.line_items": ["description", "quantity", "unit_price", "total"]
    },
    titles: {
      "$.customer": "Bill To",
      "$.vendor": "From",
      "$.line_items": "Items"
    },
    order: {
      "$": ["invoice_number", "invoice_date", "due_date", "vendor", "customer", "line_items", "subtotal", "tax_amount", "total_amount"]
    }
  }),

  /**
   * Receipt-specific UI schema
   */
  receipt: (): UiSchema => ({
    labels: {
      "$.receipt_number": "Receipt #",
      "$.date": "Date",
      "$.merchant": "Merchant",
      "$.items": "Items",
      "$.subtotal": "Subtotal",
      "$.tax": "Tax",
      "$.total": "Total"
    },
    format: {
      "$.date": "date:MMM DD, YYYY HH:mm",
      "$.subtotal": "currency",
      "$.tax": "currency",
      "$.total": "currency",
      "$.items.*.price": "currency"
    },
    as: {
      "$.items": "table"
    },
    tableCols: {
      "$.items": ["name", "quantity", "price"]
    },
    titles: {
      "$.items": "Items Purchased"
    }
  }),

  /**
   * Generic document UI schema - good for unknown/mixed data
   */
  generic: (): UiSchema => ({
    format: {
      // Auto-format common field patterns
    },
    hide: [
      "$.internal", 
      "$.debug", 
      "$.metadata.internal"
    ]
  }),

  /**
   * Contact/Profile UI schema
   */
  contact: (): UiSchema => ({
    labels: {
      "$.first_name": "First Name",
      "$.last_name": "Last Name",
      "$.email": "Email Address",
      "$.phone": "Phone Number",
      "$.address": "Address"
    },
    order: {
      "$": ["first_name", "last_name", "email", "phone", "address"]
    }
  }),

  /**
   * Annual Report UI schema for comprehensive financial documents
   */
  annualReport: (): UiSchema => ({
    labels: {
      // Report Identification
      "$.report_identification.company_name": "Company Name",
      "$.report_identification.report_title": "Report Title",
      "$.report_identification.fiscal_year": "Fiscal Year",
      "$.report_identification.currency_reported": "Currency",
      
      // Chairman Statement
      "$.chairman_statement.chairman_name": "Chairman",
      "$.chairman_statement.statement_summary": "Statement Summary",
      "$.chairman_statement.key_themes": "Key Strategic Themes",
      "$.chairman_statement.performance_metrics_quoted": "Performance Highlights",
      "$.chairman_statement.future_outlook": "Future Outlook",
      
      // Performance Metrics
      "$.chairman_statement.performance_metrics_quoted.revenue": "Revenue",
      "$.chairman_statement.performance_metrics_quoted.ebitda": "EBITDA",
      "$.chairman_statement.performance_metrics_quoted.net_profit": "Net Profit",
      "$.chairman_statement.performance_metrics_quoted.other_metrics": "Other Key Metrics",
      
      // Financial Summary
      "$.multi_year_financial_summary": "Multi-Year Financial Summary",
      "$.multi_year_financial_summary.period_years": "Period (Years)",
      "$.multi_year_financial_summary.data_by_year": "Financial Data by Year",
      
      // Management Discussion
      "$.management_discussion_and_analysis": "Management Discussion & Analysis",
      "$.management_discussion_and_analysis.business_segment_overview": "Business Segment Overview",
      "$.management_discussion_and_analysis.financial_performance_review": "Financial Performance Review",
      
      // Business Segments
      "$.management_discussion_and_analysis.business_segment_overview.*.segment_name": "Segment",
      "$.management_discussion_and_analysis.business_segment_overview.*.segment_description": "Description",
      "$.management_discussion_and_analysis.business_segment_overview.*.financial_performance": "Financial Performance",
      "$.management_discussion_and_analysis.business_segment_overview.*.key_operational_metrics": "Key Metrics",
      "$.management_discussion_and_analysis.business_segment_overview.*.swot_analysis": "SWOT Analysis",
      
      // Financial Performance
      "$.management_discussion_and_analysis.business_segment_overview.*.financial_performance.revenue_from_operations": "Revenue",
      "$.management_discussion_and_analysis.business_segment_overview.*.financial_performance.ebitda": "EBITDA",
      "$.management_discussion_and_analysis.business_segment_overview.*.financial_performance.ebitda_margin_percentage": "EBITDA Margin %",
      "$.management_discussion_and_analysis.business_segment_overview.*.financial_performance.yoy_change_revenue_percentage": "YoY Growth %",
      
      // SWOT Analysis
      "$.management_discussion_and_analysis.business_segment_overview.*.swot_analysis.strengths": "Strengths",
      "$.management_discussion_and_analysis.business_segment_overview.*.swot_analysis.weaknesses": "Weaknesses",
      "$.management_discussion_and_analysis.business_segment_overview.*.swot_analysis.opportunities": "Opportunities",
      "$.management_discussion_and_analysis.business_segment_overview.*.swot_analysis.threats": "Threats",
      
      // Contingent Liabilities
      "$.contingent_liabilities_summary": "Contingent Liabilities Summary",
      "$.contingent_liabilities_summary.total_contingent_liabilities": "Total Contingent Liabilities",
      "$.contingent_liabilities_summary.breakdown": "Breakdown",
      "$.contingent_liabilities_summary.summary": "Summary",
      
      // ESG Summary
      "$.sustainability_esg_summary": "Sustainability & ESG",
      "$.sustainability_esg_summary.esg_strategy_summary": "ESG Strategy",
      "$.sustainability_esg_summary.net_zero_commitment": "Net Zero Commitment",
      "$.sustainability_esg_summary.environmental_performance": "Environmental Performance",
      "$.sustainability_esg_summary.social_performance": "Social Performance",
      
      // Corporate Governance
      "$.corporate_governance_summary": "Corporate Governance",
      "$.corporate_governance_summary.board_composition": "Board Composition",
      "$.corporate_governance_summary.auditor_information": "Auditor Information",
      "$.corporate_governance_summary.shareholding_pattern": "Shareholding Pattern",
      
      // Financial Statements
      "$.financial_statements_summary": "Financial Statements Summary",
      "$.financial_statements_summary.balance_sheet": "Balance Sheet",
      "$.financial_statements_summary.profit_and_loss": "Profit & Loss",
      "$.financial_statements_summary.cash_flow_statement": "Cash Flow Statement"
    },
    
    format: {
      // Currency formatting
      "$.chairman_statement.performance_metrics_quoted.revenue": "currency",
      "$.chairman_statement.performance_metrics_quoted.ebitda": "currency", 
      "$.chairman_statement.performance_metrics_quoted.net_profit": "currency",
      "$.management_discussion_and_analysis.business_segment_overview.*.financial_performance.revenue_from_operations": "currency",
      "$.management_discussion_and_analysis.business_segment_overview.*.financial_performance.ebitda": "currency",
      "$.contingent_liabilities_summary.total_contingent_liabilities": "currency",
      "$.management_discussion_and_analysis.financial_performance_review.*": "currency",
      "$.financial_statements_summary.balance_sheet.assets.*": "currency",
      "$.financial_statements_summary.balance_sheet.equity_and_liabilities.*": "currency",
      "$.financial_statements_summary.profit_and_loss.income.*": "currency",
      "$.financial_statements_summary.profit_and_loss.expenses.*": "currency",
      "$.financial_statements_summary.cash_flow_statement.*": "currency",
      
      // Percentage formatting
      "$.management_discussion_and_analysis.business_segment_overview.*.financial_performance.ebitda_margin_percentage": "number",
      "$.management_discussion_and_analysis.business_segment_overview.*.financial_performance.yoy_change_revenue_percentage": "number",
      "$.sustainability_esg_summary.environmental_performance.renewable_energy_consumption_percentage": "number",
      "$.sustainability_esg_summary.environmental_performance.waste_recycled_percentage": "number",
      "$.corporate_governance_summary.shareholding_pattern.*": "number",
      
      // Number formatting
      "$.sustainability_esg_summary.environmental_performance.ghg_emissions_scope1_and_2_tonnes_co2e": "number",
      "$.sustainability_esg_summary.environmental_performance.water_consumption_kl": "number",
      "$.corporate_governance_summary.board_meetings_held": "number"
    },
    
    as: {
      "$.chairman_statement.key_themes": "list",
      "$.chairman_statement.performance_metrics_quoted.other_metrics": "table",
      "$.multi_year_financial_summary.data_by_year": "table",
      "$.management_discussion_and_analysis.business_segment_overview": "list",
      "$.management_discussion_and_analysis.business_segment_overview.*.key_operational_metrics": "table",
      "$.contingent_liabilities_summary.breakdown": "table",
      "$.corporate_governance_summary.shareholding_pattern": "kv"
    },
    
    tableCols: {
      "$.chairman_statement.performance_metrics_quoted.other_metrics": ["metric_name", "value"],
      "$.management_discussion_and_analysis.business_segment_overview.*.key_operational_metrics": ["metric_name", "value"],
      "$.contingent_liabilities_summary.breakdown": ["category", "amount"]
    },
    
    titles: {
      "$.report_identification": "Report Information",
      "$.chairman_statement": "Chairman's Statement",
      "$.chairman_statement.performance_metrics_quoted": "Performance Highlights",
      "$.multi_year_financial_summary": "Multi-Year Financial Summary",
      "$.management_discussion_and_analysis": "Management Discussion & Analysis",
      "$.management_discussion_and_analysis.business_segment_overview": "Business Segments",
      "$.contingent_liabilities_summary": "Contingent Liabilities",
      "$.sustainability_esg_summary": "Sustainability & ESG",
      "$.corporate_governance_summary": "Corporate Governance",
      "$.financial_statements_summary": "Financial Statements"
    },
    
    order: {
      "$": [
        "report_identification",
        "chairman_statement", 
        "multi_year_financial_summary",
        "management_discussion_and_analysis",
        "contingent_liabilities_summary",
        "sustainability_esg_summary",
        "corporate_governance_summary",
        "financial_statements_summary"
      ],
      "$.chairman_statement": [
        "chairman_name",
        "statement_summary",
        "key_themes",
        "performance_metrics_quoted",
        "future_outlook"
      ],
      "$.management_discussion_and_analysis": [
        "business_segment_overview",
        "financial_performance_review"
      ]
    },
    
    hide: [
      "$.report_identification.currency_reported",
      "$.multi_year_financial_summary.data_by_year.*.revenue_from_operations",
      "$.multi_year_financial_summary.data_by_year.*.total_income"
    ]
  })
};

/**
 * Auto-detect document type and suggest appropriate UI schema
 */
export function suggestUiSchema(data: any): UiSchema {
  const dataStr = JSON.stringify(data).toLowerCase();
  
  // Check for annual report indicators
  if (dataStr.includes('annual report') || 
      dataStr.includes('chairman_statement') || 
      dataStr.includes('financial_statements_summary') ||
      dataStr.includes('business_segment_overview') ||
      dataStr.includes('contingent_liabilities') ||
      (dataStr.includes('ebitda') && dataStr.includes('management_discussion')) ||
      (dataStr.includes('revenue_from_operations') && dataStr.includes('segment_name'))) {
    return createCommonUiSchemas.annualReport();
  }
  
  // Check for invoice indicators
  if (dataStr.includes('invoice') || (dataStr.includes('total') && dataStr.includes('items'))) {
    return createCommonUiSchemas.invoice();
  }
  
  // Check for receipt indicators
  if (dataStr.includes('receipt') || dataStr.includes('merchant')) {
    return createCommonUiSchemas.receipt();
  }
  
  // Check for contact indicators
  if (dataStr.includes('email') || (dataStr.includes('name') && dataStr.includes('phone'))) {
    return createCommonUiSchemas.contact();
  }
  
  // Default to generic
  return createCommonUiSchemas.generic();
}

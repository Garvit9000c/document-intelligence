/* eslint-disable react/jsx-key */
import React from "react";
import { Document, Page, Text, View, StyleSheet, Image } from "@react-pdf/renderer";
import get from "lodash.get";
import dayjs from "dayjs";
import numeral from "numeral";

/** ---------- Theme ---------- */
const theme = {
  fontFamily: "Helvetica",
  fontSize: 11,
  color: "#111",
  muted: "#6b7280",
  border: "#e5e7eb",
  h1: 18, h2: 14, h3: 12,
  page: { top: 36, right: 28, bottom: 40, left: 28 }
};

export type UiSchema = {
  /** Hide fields by json-path (e.g., "internal.secret") */
  hide?: string[];
  /** Labels by path */
  labels?: Record<string, string>;
  /** Order within an object path: ["name","email","phone"] */
  order?: Record<string, string[]>;
  /** Format by path: "currency" | "number" | "date:YYYY-MM-DD" | custom function name */
  format?: Record<string, string>;
  /** Force renderer by path: "table" | "list" | "kv" | "image" | "markdown" */
  as?: Record<string, "table"|"list"|"kv"|"image"|"markdown">;
  /** Table columns for an array path: ["a","b.c","d"] -> keys */
  tableCols?: Record<string, string[]>;
  /** Section titles for object paths */
  titles?: Record<string, string>;
};

/** ---------- Helpers ---------- */
const styles = StyleSheet.create({
  page: { paddingTop: theme.page.top, paddingRight: theme.page.right, paddingBottom: theme.page.bottom, paddingLeft: theme.page.left, fontFamily: theme.fontFamily, fontSize: theme.fontSize, color: theme.color },
  h1: { fontSize: theme.h1, marginBottom: 8, fontWeight: 700, color: "#1e40af" },
  h2: { fontSize: theme.h2, marginTop: 16, marginBottom: 6, fontWeight: 700, color: "#1e40af" },
  h3: { fontSize: theme.h3, marginTop: 10, marginBottom: 4, fontWeight: 700, color: "#374151" },
  small: { color: theme.muted },
  section: { marginBottom: 16, borderBottom: `1px solid ${theme.border}`, paddingBottom: 12 },
  row: { flexDirection: "row", borderBottom: `1px solid ${theme.border}`, paddingVertical: 4 },
  headerRow: { flexDirection: "row", backgroundColor: "#f3f4f6", borderBottom: `2px solid ${theme.border}`, paddingVertical: 6, fontWeight: 700 },
  cell: { flex: 1, paddingRight: 8, fontSize: 9 },
  headerCell: { flex: 1, paddingRight: 8, fontSize: 9, fontWeight: 700, color: "#1f2937" },
  kvrow: { flexDirection: "row", marginBottom: 4, paddingVertical: 2 },
  key: { width: "40%", color: theme.muted, fontWeight: 600, fontSize: 10 },
  val: { width: "60%", fontSize: 10 },
  img: { width: 160, height: 100, objectFit: "cover", marginBottom: 8 },
  footer: { position: "absolute", bottom: 16, left: 28, right: 28, textAlign: "center", fontSize: 9, color: theme.muted },
  tableSeparator: { marginBottom: 8, marginTop: 8 },
  longText: { fontSize: 9, lineHeight: 1.3, marginBottom: 6 },
  financialHighlight: { backgroundColor: "#eff6ff", padding: 6, marginBottom: 4, borderRadius: 2 },
  sectionBreak: { marginTop: 20, marginBottom: 10 }
});

const isPlainObject = (v:any) => Object.prototype.toString.call(v) === "[object Object]";
const isHomogeneousArray = (arr:any[]) => arr.length > 0 && arr.every(x => isPlainObject(x)) &&
  Object.keys(arr[0]).length > 0 &&
  arr.every(x => JSON.stringify(Object.keys(x).sort()) === JSON.stringify(Object.keys(arr[0]).sort()));

const labelFor = (path: string, key: string, ui?: UiSchema) =>
  ui?.labels?.[`${path}.${key}`] ?? ui?.labels?.[key] ?? titleCase(key);

function titleCase(s: string){ return s.replace(/[_\-]/g," ").replace(/\b\w/g, m=>m.toUpperCase()); }

function isHidden(path:string, ui?:UiSchema){
  return ui?.hide?.some(h => h === path) ?? false;
}

function fmt(path:string, value:any, ui?:UiSchema){
  const rule = ui?.format?.[path];
  if (!rule) return String(value);
  if (rule === "number") return numeral(value).format("0,0.[00]");
  if (rule === "currency") return numeral(value).format("0,0.00");
  if (rule.startsWith("date:")) return dayjs(value).format(rule.split(":")[1] || "YYYY-MM-DD");
  return String(value);
}

/** ---------- Core Renderers ---------- */

function KV({ path, obj, ui }:{ path:string, obj:any, ui?:UiSchema }){
  // order keys
  let keys = Object.keys(obj || {});
  const customOrder = ui?.order?.[path];
  if (customOrder) {
    const set = new Set(customOrder);
    keys = [...customOrder, ...keys.filter(k => !set.has(k))];
  }
  
  // Check if this is a section that should have special formatting
  const isMajorSection = path === "$" || path.split('.').length <= 2;
  
  return (
    <View style={isMajorSection ? styles.section : {}}>
      {keys.map((k)=> {
        const childPath = `${path}.${k}`;
        const v = obj?.[k];
        if (v == null || isHidden(childPath, ui)) return null;

        if (typeof v === "string" && (ui?.as?.[childPath] === "image" || v.startsWith("http")) && /\.(png|jpg|jpeg|gif|webp|svg|base64)/i.test(v))
          return (
            <View key={k} style={{ marginBottom: 6 }}>
              <Text style={styles.key}>{labelFor(path, k, ui)}</Text>
              <Image style={styles.img} src={v} />
            </View>
          );

        if (isPlainObject(v)) {
          const isFinancialSection = k.includes('financial') || k.includes('performance') || k.includes('statements');
          return (
            <View key={k} style={[{ marginBottom: 8 }, isFinancialSection ? styles.financialHighlight : {}]}>
              <Text style={styles.h3}>{ui?.titles?.[childPath] ?? labelFor(path, k, ui)}</Text>
              <AutoNode path={childPath} data={v} ui={ui} />
            </View>
          );
        }
        if (Array.isArray(v)) {
          return (
            <View key={k} style={{ marginBottom: 8 }}>
              <Text style={styles.h3}>{ui?.titles?.[childPath] ?? labelFor(path, k, ui)}</Text>
              <AutoArray path={childPath} arr={v} ui={ui} />
            </View>
          );
        }
        
        // Handle long text content better
        const isLongText = typeof v === 'string' && v.length > 100;
        const isFinancialValue = typeof v === 'string' && (v.includes('₹') || v.includes('crore') || v.includes('%'));
        
        return (
          <View key={k} style={styles.kvrow}>
            <Text style={styles.key}>{labelFor(path, k, ui)}</Text>
            <Text style={[
              styles.val, 
              isLongText ? styles.longText : {},
              isFinancialValue ? { fontWeight: 600, color: "#059669" } : {}
            ]}>
              {fmt(childPath, v, ui)}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Table({ path, rows, ui }:{ path:string, rows:any[], ui?:UiSchema }){
  // determine columns
  const manualCols = ui?.tableCols?.[path];
  const cols = manualCols ?? Object.keys(rows[0] ?? {});
  
  // Check if this is a financial table (contains currency values)
  const isFinancialTable = rows.some(r => cols.some(c => 
    typeof r[c] === 'string' && (r[c].includes('₹') || r[c].includes('crore') || r[c].includes('%'))
  ));
  
  return (
    <View style={styles.tableSeparator}>
      <View style={styles.headerRow}>
        {cols.map(c => <Text key={c} style={styles.headerCell}>{labelFor(path, c, ui)}</Text>)}
      </View>
      {rows.map((r, i) => (
        <View key={i} style={[styles.row, isFinancialTable && i % 2 === 0 ? { backgroundColor: "#f9fafb" } : {}]}>
          {cols.map(c => {
            const value = r[c] != null ? fmt(`${path}.${i}.${c}`, r[c], ui) : "";
            const isFinancialValue = typeof value === 'string' && (value.includes('₹') || value.includes('crore') || value.includes('%'));
            return (
              <Text key={c} style={[styles.cell, isFinancialValue ? { fontWeight: 600, color: "#059669" } : {}]}>
                {value}
              </Text>
            );
          })}
        </View>
      ))}
    </View>
  );
}

function List({ path, arr, ui }:{ path:string, arr:any[], ui?:UiSchema }){
  return (
    <View>
      {arr.map((item, i) => (
        <View key={i} style={{ marginBottom: 6 }}>
          {isPlainObject(item)
            ? <AutoNode path={`${path}.${i}`} data={item} ui={ui} />
            : <Text>- {fmt(`${path}.${i}`, item, ui)}</Text>}
        </View>
      ))}
    </View>
  );
}

function AutoArray({ path, arr, ui }:{ path:string, arr:any[], ui?:UiSchema }){
  const forced = ui?.as?.[path];
  if (forced === "table" && isHomogeneousArray(arr)) return <Table path={path} rows={arr} ui={ui} />;
  if (forced === "list") return <List path={path} arr={arr} ui={ui} />;
  if (isHomogeneousArray(arr)) return <Table path={path} rows={arr} ui={ui} />;
  return <List path={path} arr={arr} ui={ui} />;
}

export function AutoNode({ path, data, ui }:{ path:string, data:any, ui?:UiSchema }){
  if (data == null || isHidden(path, ui)) return null;
  if (Array.isArray(data)) return <AutoArray path={path} arr={data} ui={ui} />;
  if (isPlainObject(data)) return <KV path={path} obj={data} ui={ui} />;
  return <Text>{fmt(path, data, ui)}</Text>;
}

/** ---------- Multi-page Support ---------- */
function SectionRenderer({ path, data, ui, title }:{ path:string, data:any, ui?:UiSchema, title?:string }) {
  // Check if this is a major section that should start on a new page
  const isMajorSection = path.split('.').length === 2;
  const isBusinessSegment = path.includes('business_segment_overview');
  
  if (isMajorSection || isBusinessSegment) {
    return (
      <View style={styles.sectionBreak} break={isMajorSection}>
        {title && <Text style={styles.h2}>{title}</Text>}
        <AutoNode path={path} data={data} ui={ui} />
      </View>
    );
  }
  
  return <AutoNode path={path} data={data} ui={ui} />;
}

/** ---------- Top-level PDF ---------- */
export default function PdfDoc({ data, ui, title }:{ data:any, ui?:UiSchema, title?:string }){
  // For large documents like annual reports, we might need multiple pages
  const isAnnualReport = ui?.titles?.["$"] === "Report Information" || 
                         title?.toLowerCase().includes('annual report') ||
                         data?.report_identification;
  
  if (isAnnualReport && isPlainObject(data)) {
    // Render major sections with potential page breaks
    const keys = Object.keys(data);
    const customOrder = ui?.order?.["$"];
    const orderedKeys = customOrder 
      ? [...customOrder, ...keys.filter(k => !customOrder.includes(k))]
      : keys;
    
    return (
      <Document>
        <Page size="A4" style={styles.page}>
          {title && <Text style={styles.h1}>{title}</Text>}
          
          {/* First page: Report identification and summary */}
          {data.report_identification && (
            <View style={styles.section}>
              <Text style={styles.h2}>{ui?.titles?.["$.report_identification"] || "Report Information"}</Text>
              <AutoNode path="$.report_identification" data={data.report_identification} ui={ui} />
            </View>
          )}
          
          {data.chairman_statement?.statement_summary && (
            <View style={styles.section}>
              <Text style={styles.h2}>Executive Summary</Text>
              <Text style={styles.longText}>{data.chairman_statement.statement_summary}</Text>
            </View>
          )}
          
          <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
        </Page>
        
        {/* Subsequent pages for detailed sections */}
        {orderedKeys.filter(k => k !== 'report_identification').map(key => {
          const sectionData = data[key];
          if (!sectionData || isHidden(`$.${key}`, ui)) return null;
          
          const sectionTitle = ui?.titles?.[`$.${key}`] || labelFor("$", key, ui);
          const shouldBreakPage = key === 'management_discussion_and_analysis' || 
                                 key === 'financial_statements_summary' ||
                                 key === 'sustainability_esg_summary';
          
          return (
            <Page key={key} size="A4" style={styles.page}>
              <Text style={styles.h1}>{sectionTitle}</Text>
              <AutoNode path={`$.${key}`} data={sectionData} ui={ui} />
              <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
            </Page>
          );
        })}
      </Document>
    );
  }
  
  // Default single-page layout for other documents
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {title && <Text style={styles.h1}>{title}</Text>}
        <AutoNode path="$" data={data} ui={ui} />
        <Text style={styles.footer} render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`} fixed />
      </Page>
    </Document>
  );
}

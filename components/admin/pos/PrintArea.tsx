import Receipt, { ReceiptData } from "./Receipt";
import { PosSettings } from "@/lib/types";

/**
 * Mounted once on any admin page that can reprint a ticket. Invisible on
 * screen, the ONLY thing visible when window.print() fires — see the print
 * block in app/globals.css. Set the data, then call window.print().
 */
export default function PrintArea({ settings, data }: { settings: PosSettings | null; data: ReceiptData | null }) {
  if (!settings || !data) return null;
  return (
    <div id="print-area" className="hidden print:block fixed inset-0 bg-white z-[9999]">
      <Receipt settings={settings} data={data} />
    </div>
  );
}

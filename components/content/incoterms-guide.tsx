import Link from "next/link";

/** Converted from the client-approved article copy (Website Content 2.0). */
export function IncotermsGuide() {
  return (
    <>
      <p className="lede">Incoterms are internationally recognised trade terms that set out who is responsible for transport, costs, risk and customs formalities when goods are sold internationally. Choosing the wrong term can lead to delayed shipments, unexpected duty or VAT bills, and uncertainty over who should make the customs declaration.</p>
      <p>For UK, Irish and EU trade, Incoterms are particularly important because the delivery term affects customs valuation and must be declared on many import customs entries. In the UK Customs Declaration Service, the Incoterm and named location are required for imports using transaction value and are used to help calculate customs value, duty and import VAT.</p>
      <h2>What Incoterms do, and don&apos;t do</h2>
      <p>Incoterms® 2020 are published by the International Chamber of Commerce (ICC). They define:</p>
      <ul>
      <li>Who arranges and pays for transport</li>
      <li>The point at which risk transfers from seller to buyer</li>
      <li>Who is responsible for export, import and transit customs formalities</li>
      <li>Who pays duties, taxes and clearance costs</li>
      <li>Whether the seller must arrange cargo insurance</li>
      </ul>
      <p>They do not set the sale price, transfer ownership of the goods, determine payment terms or replace a full sales contract. Write them into the contract with a named place or port, for example <em>DAP Dublin Port, Ireland, Incoterms® 2020</em> or <em>FCA Supplier&apos;s Warehouse, Rotterdam, Incoterms® 2020</em>.</p>
      <div className="callout">
      <p><strong>The named location matters.</strong> &quot;DAP Ireland&quot; is too vague; &quot;DAP Dublin Port&quot; or &quot;DAP Consignee&apos;s Warehouse, Cork&quot; is much clearer.</p></div>
      <h2>The 11 Incoterms® 2020 rules</h2>
      <p>Seven rules can be used for any transport mode, including road, ferry, air freight, containerised sea freight and rail. Four are intended for sea or inland-waterway transport only.</p>
      <h3>Any transport mode</h3>
      <div className="table-cw wide">
      <table>
      <thead>
      <tr>
      <th scope="col">Term</th>
      <th scope="col">Meaning</th>
      <th scope="col">Seller&apos;s main responsibility</th>
      <th scope="col">Buyer&apos;s main responsibility</th></tr></thead>
      <tbody>
      <tr>
      <th scope="row">EXW</th>
      <td>Ex Works</td>
      <td>Makes goods available at its premises or named place</td>
      <td>Loading, export, transport, import clearance, duty and VAT</td></tr>
      <tr>
      <th scope="row">FCA</th>
      <td>Free Carrier</td>
      <td>Delivers goods to the buyer&apos;s nominated carrier and completes export clearance</td>
      <td>Main transport, import clearance, duty and VAT</td></tr>
      <tr>
      <th scope="row">CPT</th>
      <td>Carriage Paid To</td>
      <td>Pays carriage to the named destination; completes export clearance</td>
      <td>Risk transfers when goods are handed to the first carrier; handles import</td></tr>
      <tr>
      <th scope="row">CIP</th>
      <td>Carriage and Insurance Paid To</td>
      <td>As CPT, plus arranges cargo insurance</td>
      <td>Import clearance, duty and VAT</td></tr>
      <tr>
      <th scope="row">DAP</th>
      <td>Delivered at Place</td>
      <td>Delivers goods ready for unloading at the named destination; export and transit formalities</td>
      <td>Unloading, import clearance, duty and VAT</td></tr>
      <tr>
      <th scope="row">DPU</th>
      <td>Delivered at Place Unloaded</td>
      <td>Delivers and unloads goods at the named destination</td>
      <td>Import clearance, duty and VAT</td></tr>
      <tr>
      <th scope="row">DDP</th>
      <td>Delivered Duty Paid</td>
      <td>Delivers cleared goods to the named destination, including import formalities and charges</td>
      <td>Receives goods and unloads, unless agreed otherwise</td></tr>
      </tbody></table></div>
      <h3>Sea and inland waterway only</h3>
      <div className="table-cw wide">
      <table>
      <thead>
      <tr>
      <th scope="col">Term</th>
      <th scope="col">Meaning</th>
      <th scope="col">Seller&apos;s main responsibility</th>
      <th scope="col">Buyer&apos;s main responsibility</th></tr></thead>
      <tbody>
      <tr>
      <th scope="row">FAS</th>
      <td>Free Alongside Ship</td>
      <td>Delivers alongside the vessel at the port of shipment; export clearance</td>
      <td>Loads goods, arranges freight, import clearance and charges</td></tr>
      <tr>
      <th scope="row">FOB</th>
      <td>Free On Board</td>
      <td>Loads goods on board the vessel and completes export clearance</td>
      <td>Main sea freight, import clearance, duty and VAT</td></tr>
      <tr>
      <th scope="row">CFR</th>
      <td>Cost and Freight</td>
      <td>Loads goods and pays sea freight to the destination port</td>
      <td>Risk transfers once goods are on board; handles import</td></tr>
      <tr>
      <th scope="row">CIF</th>
      <td>Cost, Insurance and Freight</td>
      <td>As CFR, plus arranges marine insurance</td>
      <td>Import clearance, duty and VAT</td></tr>
      </tbody></table></div>
      <p>For containerised shipments, FCA is often safer than FOB because the seller can hand the container to the carrier at a terminal or agreed location, rather than being responsible until it is loaded on board the vessel.</p>
      <h2>Who is responsible for customs?</h2>
      <p>The key question is not simply who pays for freight. Establish who is responsible for the export declaration, import declaration, safety and security filings, transit declarations if required, import duty and VAT, health certificates and IPAFFS, TRACES NT or CHED notifications where relevant, and providing accurate commodity, origin and valuation information.</p>
      <h3>Export customs</h3>
      <p>Under most Incoterms the seller completes export customs formalities. This includes FCA, CPT, CIP, DAP, DPU, DDP, FAS, FOB, CFR and CIF. The main exception is EXW, where the buyer is responsible for export clearance. This can be a problem where the buyer is based outside the country of export and cannot practically act as exporter. For UK and EU trade, FCA is often a more workable alternative to EXW.</p>
      <h3>Import customs</h3>
      <p>Under EXW, FCA, CPT, CIP, FAS, FOB, CFR and CIF, the buyer is normally responsible for import clearance, duty, import VAT and any import licences or controls.</p>
      <p>Under DAP and DPU, the seller pays to deliver the goods to the named destination, but the buyer remains responsible for import clearance and import charges. This is a common source of confusion: a shipment can arrive at the buyer&apos;s warehouse under DAP, but the buyer may still need to appoint a customs broker, pay duty and VAT, and complete any IPAFFS or TRACES notifications.</p>
      <p>Under DDP, the seller takes responsibility for export, transit and import customs formalities, including import duty and VAT. DDP is the only Incoterm where the seller has the import-clearance obligation.</p>
      <h2>Incoterms and customs valuation</h2>
      <p>When Customs Wise submits an import declaration, we need the correct Incoterm and named place because it affects customs valuation:</p>
      <ul>
      <li><strong>EXW:</strong> the invoice price may exclude loading, export handling, freight and insurance. These costs may need to be added to arrive at the customs value.</li>
      <li><strong>CIF:</strong> the price includes cost, insurance and freight to the named destination port, so the valuation treatment is different.</li>
      <li><strong>DAP:</strong> delivery costs may be included up to the named place, and the relevant freight element must be identified accurately.</li>
      <li><strong>DDP:</strong> the invoice may include duty, VAT and clearance charges, which may need to be separated from the customs value.</li>
      </ul>
      <p>UK guidance requires the declared delivery-terms code to include both the Incoterm and the location up to which it applies. Irish customs valuation also generally starts with the price paid or payable, then considers transport, insurance and other costs.</p>
      <h2>Common Incoterms explained</h2>
      <h3>EXW: Ex Works</h3>
      <p><em>Example: EXW Supplier Warehouse, Manchester, Incoterms® 2020.</em> The seller makes the goods available at its premises. The buyer takes responsibility from that point, including loading, transport and customs formalities. EXW is often unsuitable where the seller needs to control export compliance.</p>
      <h3>FCA: Free Carrier</h3>
      <p><em>Example: FCA Supplier Warehouse, Belfast, Incoterms® 2020.</em> The seller delivers goods to the buyer&apos;s nominated carrier at an agreed place and completes export clearance. If delivery is at the seller&apos;s premises, the seller loads the vehicle. The buyer handles import customs. FCA is commonly used for road freight and containerised shipments.</p>
      <h3>CPT and CIP: Carriage Paid To and Carriage and Insurance Paid To</h3>
      <p><em>Example: CPT Dublin Port, Ireland, Incoterms® 2020.</em> The seller arranges and pays for transport to the named destination; under CIP it also arranges insurance. However, risk transfers much earlier, when the seller hands the goods to the first carrier. The buyer remains responsible for import clearance, duty and VAT.</p>
      <h3>DAP: Delivered at Place</h3>
      <p><em>Example: DAP Consignee Warehouse, Cork, Incoterms® 2020.</em> The seller delivers the goods to the agreed destination, ready for unloading, and handles export formalities and transport. The buyer handles Irish, UK or EU import clearance, duty, VAT and any SPS documentation.</p>
      <h3>DPU: Delivered at Place Unloaded</h3>
      <p>Similar to DAP, except the seller must unload the goods at the named destination. The buyer still completes import formalities and pays import duty and VAT. Use DPU only where the seller can safely arrange unloading at the agreed location.</p>
      <h3>DDP: Delivered Duty Paid</h3>
      <p><em>Example: DDP Customer Warehouse, London, Incoterms® 2020.</em> The seller delivers goods cleared for import to the buyer&apos;s named location, taking responsibility for export and import formalities, duty and import taxes. Use DDP carefully, particularly where the seller has no UK or Irish EORI, VAT registration, deferment arrangement or ability to act as importer of record.</p>
      <h2>Food, seafood and plant products</h2>
      <p>For regulated goods, the Incoterm does not remove legal food, animal-health or plant-health requirements. A seafood shipment sold DAP Dublin may place transport costs on the seller, but the Irish buyer may still need to be the importer of record and complete the Irish customs declaration, TRACES NT notification, CHED-P where required, Border Control Post arrangements and IUU/CATCH documentation for relevant wild-caught fish.</p>
      <p>Likewise, a plant shipment sold DDP Great Britain may mean the overseas seller takes import responsibility, but it must still comply with UK plant-health, IPAFFS and phytosanitary requirements. Always agree in writing who will provide the documents, make the entries and pay the fees before the goods leave.</p>
      <h2>Choosing the right Incoterm</h2>
      <p>Before agreeing a delivery term, ask:</p>
      <ul>
      <li>Who will be the exporter of record, and who will be the importer of record?</li>
      <li>Who has the necessary EORI and VAT registrations?</li>
      <li>Who will appoint the customs broker?</li>
      <li>Who pays duty, import VAT, port charges and inspection fees?</li>
      <li>Who completes IPAFFS, TRACES NT, CHED or health-certificate requirements?</li>
      <li>At what point does risk transfer?</li>
      <li>Is the named delivery place specific enough, and is the term suitable for the transport method?</li>
      <li>Does the invoice show the agreed Incoterm and location?</li>
      </ul>
      <h2>How Customs Wise can help</h2>
      <p>Customs Wise supports importers, exporters, hauliers and freight forwarders across the UK and Ireland. We can help you understand the customs implications of your Incoterms, align commercial invoices with customs declarations, calculate customs value and complete UK and Irish import or export clearance.</p>
      <p>If you are unsure whether to use FCA, DAP, DDP or another Incoterm for your next shipment, <Link href="/contact">contact our team before goods move</Link>. Getting the term right at the start can prevent delays, unexpected charges and compliance issues later.</p>
    </>
  );
}

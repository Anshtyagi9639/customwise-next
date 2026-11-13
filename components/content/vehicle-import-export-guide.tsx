import Link from "next/link";

/**
 * Converted from the client-supplied article "How to Import or Export Vehicles in the UK and Ireland"
 * (Website Change 3 Shivam.docx). Wording as supplied; only formatting and obvious typos were changed.
 */
export function VehicleImportExportGuide() {
  return (
    <>
      <p className="lede">Buying a car overseas, moving home or trading vehicles internationally? Before arranging transport, you need to understand the customs paperwork, taxes and registration requirements.</p>
      <p>The process depends on where the vehicle comes from and where it is going. Great Britain – England, Scotland and Wales – has different customs rules from Northern Ireland. Bringing a vehicle into Ireland also involves registration requirements that are separate from customs clearance.</p>
      <p>This guide covers permanent vehicle movements. Temporary visits, repairs and specialist vehicles may follow different procedures.</p>

      <h2>Importing a vehicle into Great Britain</h2>
      <p>When permanently importing a vehicle into Great Britain, you will normally need to:</p>
      <ol>
        <li>Complete a customs import declaration.</li>
        <li>Pay or account for applicable Customs Duty and import VAT.</li>
        <li>Notify HMRC of the arrival.</li>
        <li>Obtain any necessary vehicle approval.</li>
        <li>Register and tax the vehicle with DVLA, then insure it before road use.</li>
      </ol>
      <p>The order matters. If a shipping company transports the vehicle, customs clearance normally takes place before arrival or at the border. If you personally bring it by ferry or through the Channel Tunnel, HMRC’s published process starts with notifying HMRC; it then confirms whether an import declaration and taxes are required.</p>
      <h3>Which documents will you need?</h3>
      <p>Depending on the transaction, prepare:</p>
      <ul>
        <li>Purchase invoice or bill of sale.</li>
        <li>Original overseas registration certificate or title document.</li>
        <li>Vehicle Identification Number, also called the VIN or chassis number.</li>
        <li>Arrival date and transport details.</li>
        <li>Customs import reference, known as the MRN, where applicable.</li>
        <li>Any evidence supporting a tax-relief claim.</li>
        <li>Vehicle approval documents for DVLA registration.</li>
      </ul>
      <p>For some NOVA applications, HMRC requires a current valuation if the vehicle was purchased more than six months earlier. DVLA also requires original supporting documents, including the foreign registration certificate, subject to its stated exceptions.</p>
      <h3>What are NOVA and the taxes payable?</h3>
      <p>NOVA means Notification of Vehicle Arrivals. You must normally notify HMRC within 14 days of a permanent import. NOVA is not a replacement for a customs import declaration, and DVLA cannot register the vehicle until HMRC has processed the notification.</p>
      <p>Customs Duty depends on the vehicle, its origin and any available relief. Import VAT is calculated on the relevant value, including applicable delivery costs and Customs Duty – not necessarily just the purchase price. Moving-home or returned-vehicle relief may be available, but eligibility must be established.</p>

      <h2>Exporting a vehicle from Great Britain</h2>
      <p>For a commercial export, arrange the appropriate customs export clearance and check the destination country’s import requirements. Separately, notify DVLA if the vehicle is leaving the UK for 12 months or more. Completing the V5C permanent-export section does not replace customs formalities.</p>

      <h2>Importing a vehicle into Ireland</h2>
      <h3>What must happen before registration?</h3>
      <p>A vehicle purchased in Great Britain and brought into Ireland requires a customs declaration, applicable Customs Duty and import VAT. These requirements also apply if the GB vehicle is simply transported through Northern Ireland. Customs clearance must be completed before Irish registration.</p>
      <p>For the customs assessment, have the invoice, registration document, VIN, route and transport costs ready. If claiming preferential duty treatment, provide suitable origin evidence: a UK registration document does not, by itself, prove UK origin.</p>
      <h3>What charges should you budget for?</h3>
      <p>There are three separate areas to consider:</p>
      <ul>
        <li><strong>Customs Duty:</strong> vehicle classification, origin and any applicable preference or relief.</li>
        <li><strong>Import VAT:</strong> the vehicle’s taxable import value and applicable VAT treatment.</li>
        <li><strong>Vehicle Registration Tax:</strong> vehicle category and the relevant Irish registration-tax rules.</li>
      </ul>
      <p>Paying Customs Duty and import VAT does not settle VRT. Equally, a Customs Duty relief does not automatically remove every other charge.</p>
      <p>For most passenger cars, VRT combines a CO₂-based charge with a nitrogen oxide, or NOx, component. The CO₂ calculation uses Revenue’s Open Market Selling Price – the assessed Irish market value – not simply the overseas invoice price. Different vehicle categories have different calculations.</p>
      <h3>What documents are needed for Irish registration?</h3>
      <p>For a typical used-vehicle registration at an NCTS centre, prepare:</p>
      <ul>
        <li>Original foreign registration certificate, such as the UK V5C.</li>
        <li>Purchase invoice showing the purchase date.</li>
        <li>Customs declaration and MRN, where required.</li>
        <li>Evidence of the vehicle’s arrival date.</li>
        <li>Proof of identity, address and PPS number.</li>
        <li>The appropriate Vehicle Purchase Details form.</li>
        <li>Acceptable CO₂ and NOx emissions evidence.</li>
        <li>Revenue’s exemption notification, if claiming VRT relief.</li>
      </ul>
      <p>For a new vehicle, an appropriate Certificate of Conformity or approved alternative is also required.</p>
      <p>Make the registration appointment within seven days of arrival and complete registration within 30 days, subject to exceptions such as vehicles held by authorised motor traders. Missing documents can prevent registration and lead to additional charges.</p>

      <h2>Exporting a vehicle from Ireland</h2>
      <p>For a vehicle leaving Ireland for GB or another non-EU destination, arrange the relevant export and destination import formalities.</p>
      <p>You may also qualify for repayment of residual VRT. If applying, the vehicle must undergo an NCTS export examination before departure and leave Ireland within 30 days of that examination. Check eligibility before booking transport.</p>

      <h2>Moving vehicles between Northern Ireland and Ireland</h2>
      <h3>Northern Ireland to Ireland</h3>
      <p>A qualifying used vehicle legally imported into Northern Ireland can be brought into Ireland without additional Customs Duty or import VAT. However, buying from an NI seller does not automatically establish eligibility.</p>
      <p>Revenue accepts an NI import declaration showing compliance with the Windsor Framework. If that is unavailable, Revenue may accept alternative proof at its discretion. Its minimum alternative evidence includes:</p>
      <ul>
        <li>The original V5C showing the last registered keeper as resident in NI.</li>
        <li>NI service history.</li>
        <li>NI MOT history.</li>
      </ul>
      <p>The evidence must identify the specific vehicle and is subject to verification. Obtain it before buying. Irish VRT and registration requirements still apply.</p>
      <p>New vehicles have separate VAT rules. A vehicle advertised as “used” can still be new for VAT purposes because of its age or mileage, so check both before agreeing the purchase.</p>
      <h3>Ireland to Northern Ireland</h3>
      <p>HMRC states that an import declaration is not required when bringing a vehicle into Northern Ireland from the EU. However, a permanent import still requires the relevant NOVA notification, VAT assessment and DVLA registration steps.</p>
      <p>VAT treatment depends on the transaction. New vehicles and business purchases need particular attention; do not assume that “no customs declaration” means “no tax or paperwork”.</p>

      <h2>Moving home or trading vehicles? Check before shipping</h2>
      <p>Individuals moving home may qualify for transfer-of-residence relief. Businesses should establish the correct importer, VAT treatment and any authorised motor-trader arrangements. Neither relief nor VAT recovery should be assumed without checking the conditions.</p>
      <p>
        Before purchasing or booking transport, <Link href="/contact?service=import#enquiry">send your customs agent</Link> the invoice, registration document, VIN and intended route. Establishing the vehicle’s history and required paperwork early helps avoid unexpected costs and registration delays.
      </p>
    </>
  );
}

import { EnquiryForm } from "@/components/forms/enquiry-form";
import { ContactDetails } from "./contact-details";

export function EnquirySection() {
  return (
    <section id="enquire" aria-labelledby="enquiry-title" className="bg-clearance py-16 text-[#e3ecf0] sm:py-24 lg:py-28">
      <div data-reveal className="container-site grid items-start gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-20">
        <div>
          <p className="mb-3 text-[0.95rem] font-semibold tracking-wide text-freight">Make an enquiry</p>
          <h2 id="enquiry-title" className="text-[clamp(2rem,3.6vw,3rem)] text-salt">Tell us what you need to move</h2>
          <p className="mt-4 text-[1.1rem] text-[#c9d8de]">Our team replies with the documents and steps your shipment needs.</p>
          <ContactDetails tone="dark" />
        </div>
        <EnquiryForm idPrefix="home" />
      </div>
    </section>
  );
}

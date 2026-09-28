import { SectionHeading } from "./section-heading";

const steps = [
  { title: "Tell us about the shipment", text: "Send us the commodity, origin, destination and route using the enquiry form or by phone." },
  { title: "We confirm the documents", text: "We set out the exact document set your goods need, including any health, SPS or origin paperwork." },
  { title: "We prepare and submit", text: "Declarations, pre-notifications and transit documents are lodged accurately and on time." },
  { title: "We keep you updated", text: "Proactive communication with you, your haulier and the authorities until the goods are released." },
];

export function ProcessSection() {
  return (
    <section aria-labelledby="process-title" className="py-16 sm:py-24 lg:py-28">
      <div data-reveal className="container-site">
        <SectionHeading kicker="How it works" title="From first enquiry to cleared goods" id="process-title" intro="Tell us what you're moving and where. We take it from there." />
        <ol className="grid gap-x-6 gap-y-10 border-t-2 border-line pt-2 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s, i) => (
            <li key={s.title} className="relative pt-7">
              <span aria-hidden className="absolute -top-[1.2rem] left-0 grid size-8 place-items-center rounded-full bg-cargo text-[0.95rem] font-bold text-overnight">
                {i + 1}
              </span>
              <h3 className="text-[1.3rem] text-overnight">
                <span className="sr-only">Step {i + 1}: </span>
                {s.title}
              </h3>
              <p className="mt-2 text-[0.95rem] text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

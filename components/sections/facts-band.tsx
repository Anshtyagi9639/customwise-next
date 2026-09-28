import { BrandIcon } from "@/components/icons/brand-icon";

/** Only facts stated in the client's content document. */
const facts = [
  { icon: "/icons/docs.png", title: "30 years", text: "in customs compliance" },
  { icon: "/icons/ship.png", title: "Any UK or Irish port", text: "inventory-linked and Ro-Ro" },
  { icon: "/icons/map.png", title: "50+ countries", text: "through our AEB partner network" },
  { icon: "/icons/headset.png", title: "7 days a week", text: "from 5am on weekdays" },
];

export function FactsBand() {
  return (
    <section aria-label="Customs Wise at a glance" className="bg-ship text-salt">
      <ul className="container-site grid sm:grid-cols-2 lg:grid-cols-4">
        {facts.map((f, i) => (
          <li
            key={f.title}
            className={`flex items-center gap-3.5 border-salt/10 py-6 leading-snug ${i > 0 ? "border-t sm:border-t-0" : ""} ${i >= 2 ? "sm:border-t lg:border-t-0" : ""} lg:px-5 lg:first:pl-0 ${i > 0 ? "lg:border-l" : ""}`}
          >
            <BrandIcon src={f.icon} size={44} className="size-11 shrink-0 brightness-[1.35]" />
            <span className="text-[0.95rem]">
              <strong className="block font-display text-[1.3rem] font-normal text-cargo">{f.title}</strong>
              {f.text}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

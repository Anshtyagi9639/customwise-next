import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import type { Faq } from "@/types";

export function FaqList({ items }: { items: Faq[] }) {
  return (
    <Accordion type="multiple" className="max-w-[54rem]">
      {items.map((f) => (
        <AccordionItem key={f.question} value={f.question}>
          <AccordionTrigger>{f.question}</AccordionTrigger>
          <AccordionContent>
            <p>{f.answer}</p>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

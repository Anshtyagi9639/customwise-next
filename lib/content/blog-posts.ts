import type { BlogPost } from "./blog";

/**
 * Customs Wise blog posts, from the client's "Blog CW" documents (one .docx per article), newest first.
 * Wording is as supplied; only formatting (headings, lists, captions) and a few obvious typos were changed.
 * Dates are only set where the source gives a full date (five newer posts give a day and month but no year).
 * Authors are not shown: the source only has blog-platform usernames.
 */
export const blogPosts: BlogPost[] = [
  // Source: EU CATCH system.docx
  {
    "slug": "eu-catch-system-six-months-in",
    "title": "EU CATCH system: Six months in, how is it really working?",
    "excerpt": "The EU’s CATCH system went live on 10 January 2026 as the new digital backbone for wild-caught fishery product imports. Six months in, how is it really working?",
    "topic": "food-customs",
    "readMinutes": 3,
    "body": [
      {
        "type": "p",
        "text": "The EU’s CATCH system went live on 10 January 2026 as the new digital backbone for wild-caught fishery product imports. It requires digital catch certificates, importer declarations and full traceability in TRACES NT, with the stated aim of closing loopholes in the old paper-based regime and making it harder for IUU (illegal, unreported and unregulated) fish to enter the EU market. From day one, the system has been mandatory for EU importers, and the original six-month grace period for certain new data fields ran until 10 July 2026. Since that date, a fully completed CATCH entry has been required for new certificates, with only limited, country-specific flexibilities remaining (notably for the US until November 2026)."
      },
      {
        "type": "p",
        "text": "On paper, the timeline looks clear: the transitional window is over, the rules are in force, and CATCH is now the standard. But the reality on the ground has been more complicated. Within the first two weeks of launch, industry bodies such as Seafood Europe logged dozens of operational challenges, and six months in, many importers, processors still describe the system as unworkable in practice for parts of their business."
      },
      {
        "type": "p",
        "text": "The positives are real: CATCH is a single EU-wide platform that should, in theory, make data more transparent, reduce document fraud and allow authorities to cross-check catches more effectively. For well-resourced operators with relatively simple supply chains, the shift to digital certificates has already improved visibility and control. However, the drawbacks have been significant. The system has been criticised for:"
      },
      {
        "type": "ul",
        "items": [
          "Lack of integration with national customs control systems, leading to stock being refused or delayed at major ports.",
          "Technical gaps and errors: server timeouts, slow performance on multi-vessel consignments (sometimes minutes per refresh), and search functions that fail to locate certificates while simultaneously flagging them as duplicates.",
          "Data entry burdens: many third-country authorities still issue paper certificates, so EU importers must manually re-type large volumes of data. File-size limits (initially 2 MB) have been too small for lengthy certificates, and key data fields do not always flow automatically between steps (e.g. from certificate to processing statement to importer declaration), forcing re-entry of the same information.",
          "Operational mismatches: requirements such as recording zero-kg catches and very tight tolerance margins are seen as unrealistic for certain fisheries, increasing the risk of unintentional non-compliance and fines.",
          "Structural issues: the system does not yet fully cover some important categories (e.g. certain indirect imports, re-exports of processed products, or all species), and the absence of a formal delegation mechanism means agents often perform compliance-critical tasks without clear legal authority, creating liability uncertainty and additional workload."
        ]
      },
      {
        "type": "p",
        "text": "These issues have translated into real trade disruption: containers held at ports, extra costs for agents and intermediaries, and delays that are particularly damaging for fresh and chilled seafood. The EU has responded with targeted extensions (for example, prolonging US flexibilities to 30 November 2026), but industry groups argue that the problems are systemic rather than cosmetic, and that full, smooth implementation will take longer than the original timetable allowed."
      },
      {
        "type": "p",
        "text": "It’s also important to remember that the transitional architecture is not yet complete. The current rules allow old catch certificates issued before 10 January 2026 to remain in use in CATCH until 10 January 2028, and simplified catch certificates validated before 10 January 2027 will be valid for one year. Only from 10 January 2028 will the revised templates (normal catch certificate, simplified catch certificate and Annex IV processing statement) become mandatory for all countries, with no exceptions. In other words, the full CATCH framework is still rolling out, and the next 18 months will be critical for both businesses and authorities."
      },
      {
        "type": "p",
        "text": [
          "At Customs Wise, ",
          {
            "text": "we specialise in complex food customs",
            "href": "/food-customs"
          },
          ", and supporting fish importers is a core part of our work. We are already supporting several fish importers in preparing and processing CATCH declarations through TRACES NT, aligning them with CHEDs and customs entries, and managing the practical issues that arise at the BCP. If you are importing wild-caught fishery products into the EU or Ireland and need help navigating CATCH, grace periods and the wider IUU requirements, get in touch, we can help you keep your shipments moving while staying compliant."
        ]
      }
    ],
    "related": [
      {
        "label": "Food customs",
        "href": "/food-customs"
      },
      {
        "label": "CATCH certificates guide",
        "href": "/food-customs/catch-certificates"
      },
      {
        "label": "TRACES & IPAFFS entries",
        "href": "/services#traces-ipaffs-entries"
      }
    ],
    "image": {
      "src": "/images/blog/eu-catch-system-six-months-in.jpg",
      "alt": "Crates of fresh fish on ice in a fish processing hall",
      "width": 1380,
      "height": 1067
    }
  },
  // Source: Understanding the UK IPAFFS System for UK Food Importers.docx
  {
    "slug": "uk-ipaffs-system-for-food-importers",
    "title": "Understanding the UK IPAFFS System for UK Food Importers",
    "excerpt": "How the UK IPAFFS system works, when an IPAFFS pre-notification is required, and what food importers need to know to keep goods moving efficiently into Great Britain.",
    "topic": "food-customs",
    "readMinutes": 3,
    "body": [
      {
        "type": "p",
        "text": "UK businesses importing food, plants, animals, and products of animal origin (POAO) must comply with sanitary and phytosanitary controls. This is where IPAFFS comes in. This guide explains how the UK IPAFFS system works, when an IPAFFS pre-notification is required, and what food importers need to know to keep goods moving efficiently into Great Britain."
      },
      {
        "type": "p",
        "text": "IPAFFS, which stands for the Import of Products, Animals, Food and Feed System, is the UK government’s online platform used to manage import notifications for goods that are subject to health and safety controls. While it may seem like just another administrative requirement, understanding how IPAFFS works is essential for keeping goods moving into the UK."
      },
      {
        "type": "h2",
        "text": "What is IPAFFS?"
      },
      {
        "type": "p",
        "text": "IPAFFS was introduced to allow UK authorities to monitor and manage the import of goods that could pose risks to human, animal, or plant health. The system enables importers, agents, and businesses to submit IPAFFS pre-notifications before certain goods arrive in Great Britain."
      },
      {
        "type": "p",
        "text": "These notifications provide authorities with information about the shipment, allowing them to carry out risk assessments and determine whether inspections or additional checks are required. In simple terms, IPAFFS helps ensure that regulated goods entering the UK meet the necessary health and safety requirements before they reach the market."
      },
      {
        "type": "h2",
        "text": "Which Goods Require IPAFFS?"
      },
      {
        "type": "p",
        "text": "The requirement to use IPAFFS depends on both the type of goods being imported and the country they are coming from. Goods that commonly require notification include Products of Animal Origin (POAO), live animals, certain food and feed products, plants, plant products, and some high-risk food items."
      },
      {
        "type": "p",
        "text": "The UK applies different controls depending on whether goods are categorised as low, medium, or high risk. Medium-risk goods may be subject to routine documentary and identity checks, while high-risk food and feed products can face increased inspection requirements at Border Control Posts (BCPs)."
      },
      {
        "type": "p",
        "text": "Import requirements can vary depending on the commodity, its origin, and the latest UK border controls. As these rules continue to evolve, businesses should always check that they understand the current requirements before goods are shipped."
      },
      {
        "type": "h2",
        "text": "Which CHED Form Do You Require?"
      },
      {
        "type": "p",
        "text": "Many regulated imports require a Common Health Entry Document (CHED) as part of the IPAFFS process."
      },
      {
        "type": "ul",
        "items": [
          [
            {
              "strong": "CHED-P"
            },
            " – Products of Animal Origin (POAO) such as meat, dairy, fish, and eggs."
          ],
          [
            {
              "strong": "CHED-A"
            },
            " – Live animals entering Great Britain."
          ],
          [
            {
              "strong": "CHED-PP"
            },
            " – Plants, plant products, and certain forestry products."
          ],
          [
            {
              "strong": "CHED-D"
            },
            " – High-risk food and feed of non-animal origin."
          ]
        ]
      },
      {
        "type": "p",
        "text": "Submitting the correct CHED form is essential, as mistakes can result in delays, additional inspections, or rejected consignments."
      },
      {
        "type": "h2",
        "text": "How Does the IPAFFS Process Work?"
      },
      {
        "type": "p",
        "text": "The IPAFFS process begins before goods arrive in Great Britain. The importer or their representative must submit a notification through the IPAFFS portal, providing details about the shipment, including information on the importer, exporter, goods being moved, country of origin, transport arrangements, and any supporting documentation that may be required."
      },
      {
        "type": "p",
        "text": "Once the notification has been submitted, IPAFFS generates a unique reference number that forms part of the wider customs process. Authorities can then review the information and determine whether any documentary, identity, or physical checks are necessary before the goods continue their journey."
      },
      {
        "type": "p",
        "text": "In many cases, shipments move without issue when the information submitted is accurate and complete. However, mistakes or missing details can quickly lead to delays and additional scrutiny."
      },
      {
        "type": "h2",
        "text": "Common Challenges for Importers"
      },
      {
        "type": "p",
        "text": "One of the biggest challenges businesses face is ensuring that all information submitted is correct. Errors in commodity descriptions, origin details, CHED documentation, or supporting certificates can result in delays, increased costs, and unnecessary complications at the border."
      },
      {
        "type": "p",
        "text": "Another difficulty is keeping up with changing regulations. Since Brexit, UK import procedures have continued to develop, and businesses that do not regularly import regulated goods may find it difficult to stay current with the latest requirements."
      },
      {
        "type": "h2",
        "text": "Why IPAFFS Matters"
      },
      {
        "type": "p",
        "text": "For businesses importing regulated goods, IPAFFS is far more than an administrative requirement. It plays an important role in protecting public, animal, and plant health while also supporting the efficient movement of goods into Great Britain. Accurate IPAFFS pre-notifications can help reduce the risk of delays, minimise disruptions to supply chains, and ensure businesses remain compliant with border regulations."
      },
      {
        "type": "h2",
        "text": "How Customs Wise Can Help"
      },
      {
        "type": "p",
        "text": [
          "Customs Wise specialises in providing customs clearance for food importers and exporters in the UK and Ireland. We have extensive experience supporting traders and logistics companies with meat, dairy, fish, fresh produce, and other food-related customs requirements. We can support you in ensuring all the correct documentation is in place ahead of time and ",
          {
            "text": "submitting IPAFFS notifications on your behalf",
            "href": "/services#traces-ipaffs-entries"
          },
          "."
        ]
      },
      {
        "type": "p",
        "text": "As UK border requirements continue to develop, having the right customs support in place can make all the difference. If you have questions about IPAFFS or any aspect of importing goods into the UK or Ireland, the Customs Wise team is happy to help."
      }
    ],
    "related": [
      {
        "label": "TRACES & IPAFFS entries",
        "href": "/services#traces-ipaffs-entries"
      },
      {
        "label": "Food customs",
        "href": "/food-customs"
      },
      {
        "label": "Importing POAO",
        "href": "/food-customs/products-of-animal-origin"
      }
    ]
  },
  // Source: Transfer of Residence Ireland.docx
  {
    "slug": "transfer-of-residence-ireland-2026-guide",
    "title": "Transfer of Residence Ireland: A Complete 2026 Guide",
    "excerpt": "If you are moving to Ireland from outside the European Union, you may be entitled to bring your personal belongings into the country without paying Customs Duty or VAT.",
    "topic": "practical-guidance",
    "readMinutes": 3,
    "body": [
      {
        "type": "p",
        "text": "If you are moving to Ireland from outside the European Union, you may be entitled to bring your personal belongings into the country without paying Customs Duty or VAT. This is known as Transfer of Residence (ToR) relief. The rules can appear technical and confusing, and mistakes often lead to delays, unexpected charges, or goods being held at port. Understanding how Transfer of Residence works in Ireland in 2026 can save time, stress, and money."
      },
      {
        "type": "p",
        "text": "Transfer of Residence relief allows individuals who are transferring their normal place of residence to Ireland to import their personal property free from Customs Duty and VAT. It most commonly applies to Irish citizens returning home after living outside the EU, individuals relocating to Ireland for employment, or families moving permanently from a non-EU country. Without ToR relief, household goods may be subject to customs charges based on their declared value, which can be significant depending on the shipment."
      },
      {
        "type": "p",
        "text": "To qualify for Transfer of Residence relief in Ireland, you must generally have lived outside the EU for at least twelve consecutive months prior to your move. The goods being imported must have been in your possession and used by you for at least six months before the date you transfer your residence. You must be moving your normal place of residence to Ireland, and the goods must be intended for personal use rather than commercial purposes. Revenue assesses each application individually and may request supporting documentation to verify eligibility. It is important to understand that ToR relief does not apply to alcohol, tobacco products, or goods intended for business use, and specific rules apply in relation to vehicles."
      },
      {
        "type": "p",
        "text": "The types of goods that can normally be imported under Transfer of Residence relief include household furniture, clothing, personal belongings, electrical appliances, and provided the conditions are met, a personal vehicle. The shipment should reflect a genuine move of residence. Large volumes of brand-new or unused items can raise concerns with authorities and may result in additional scrutiny (or documentation requests) from customs authorities. As a result, it’s all the more crucial to ensure that your logged inventory accurately reflects your used personal belongings."
      },
      {
        "type": "p",
        "text": "When applying for Transfer of Residence in Ireland, documentation is critical. You will typically need proof that you lived outside the EU for the required period (12 consecutive months), such as utility bills, a tenancy agreement, or an employment contract. You will also need evidence of your move to Ireland, which may include proof of your Irish address, PPS number, or employment details. A detailed inventory of the goods being imported is required (as mentioned above), along with confirmation that the items were owned and used for at least six months. Incomplete or inconsistent documentation is one of the most common reasons for delays in approval."
      },
      {
        "type": "p",
        "text": "Applications for ToR relief are made to Irish Revenue either before or at the time your goods arrive in Ireland. The process involves submitting the relevant application and supporting documents, followed by correctly declaring the goods on import. If the application is approved and all customs declarations are accurate, the goods can be cleared without payment of duty or VAT. However, if there are errors in the declaration, missing paperwork, or unanswered questions regarding eligibility, shipments can be held at port and storage charges may begin to accumulate."
      },
      {
        "type": "p",
        "text": "Processing times for Transfer of Residence approval vary depending on the complexity of the case and the levels to which the documentation provided are completed. Straightforward applications with clear supporting evidence are generally processed more quickly, while incomplete applications can experience delays. Planning ahead is essential, particularly if your household goods are already in transit."
      },
      {
        "type": "p",
        "text": "Although it is possible to manage a Transfer of Residence application independently, many individuals choose to seek professional customs support to ensure the process runs smoothly. Accurate documentation, correct customs declarations, and clear communication with Revenue can significantly reduce the risk of delays, additional costs, or compliance issues. Relocating to a different country can be stressful enough, so avoiding customs complications can make the transition a lot easier."
      },
      {
        "type": "p",
        "text": "If you are planning a move to Ireland and want clarity on your Transfer of Residence eligibility, seeking the proper guidance can provide reassurance and certainty. At Customs Wise, we can help assist you or your family with Transfer of Residence applications, customs declarations, and the clearance of household goods into Ireland. If you would like support with your upcoming move, our team is ready to help ensure the process is smooth from start to finish."
      }
    ],
    "related": [
      {
        "label": "Import customs clearance",
        "href": "/services#import-customs-clearance"
      },
      {
        "label": "Contact our team",
        "href": "/contact"
      }
    ],
    "image": {
      "src": "/images/blog/transfer-of-residence-ireland-2026-guide.png",
      "alt": "Moving boxes and furniture blankets loaded in the back of a removal van",
      "width": 594,
      "height": 406
    }
  },
  // Source: Understanding the New CATCH Process for EU Fish Imports..docx
  {
    "slug": "new-catch-process-eu-fish-imports",
    "title": "Understanding the New CATCH Process for EU Fish Imports",
    "excerpt": "Recent changes to the CATCH system represent a real shift in how controls on fish and seafood imports into the EU work in practice.",
    "topic": "food-customs",
    "readMinutes": 4,
    "body": [
      {
        "type": "p",
        "text": "Fish and seafood imports into the EU have always been subject to a high level of control, but recent changes to the CATCH system represent a real shift in how those controls work in practice. For businesses importing fish into the EU has become a central part of how shipments are cleared and how delays are avoided."
      },
      {
        "type": "p",
        "text": "At Customs Wise, we are already seeing the impact of these changes on live shipments coming through the system. The updated CATCH process is much more digital, much more interconnected with customs systems, and far less forgiving of mistakes than the old paper-based approach."
      },
      {
        "type": "p",
        "text": "CATCH is the EU’s electronic system for managing catch certificates, which are required for all wild caught marine fish entering the EU from external countries. These certificates are designed to prove that fish have been caught legally and in line with international and EU rules on sustainable fishing. For years, this system existed in a fragmented way, with a mix of physical paperwork, national platforms and manual checks. The new version brings everything into a single EU-wide digital system, with authorities able to see, cross-check and validate information in real time."
      },
      {
        "type": "p",
        "text": "In practical terms, the biggest change is that catch certificates now have to exist and be validated in CATCH before a customs declaration can be properly completed. Exporters or competent authorities in the country of catch create the certificate, but EU importers must make sure it is accurate, complete and properly endorsed. Customs authorities then check the CATCH reference as part of the import process, comparing it against the declaration, the invoice and the goods themselves. If something does not line up, the system flags it almost immediately."
      },
      {
        "type": "p",
        "text": "This has shifted responsibility more clearly onto the importer. While suppliers and foreign authorities still play a role, the legal obligation ultimately sits with the business inside the EU bringing the goods into the market. Relying on a supplier to “sort the paperwork” is no longer enough. Importers now need visibility over what has been submitted in CATCH, if it has been validated, and whether it matches what is being declared to customs. Without that oversight, even small errors can lead to consignments being held or rejected at the border."
      },
      {
        "type": "p",
        "text": "What is being seen in practice is that many of the problems are not dramatic compliance failures, but simple data issues. Species codes entered slightly differently, quantities that do not match exactly between documents, certificates that are created but not formally validated, or references that are missing from the customs entry. Under the old system, some of these might have slipped through. Under the new system, they are much more likely to be picked up automatically."
      },
      {
        "type": "p",
        "text": "A major part of this is that the new CATCH system requires a significantly expanded data set compared to before. Information such as the fishing trip start date, gear type used, and much more detailed catch area data now has to be captured. This includes not just the FAO zone, but also whether the catch took place in an EEZ or on the high seas, and which RFMO applies. Transport data has also been extended, with details required on the first mode of transport from the export point, the point of entry into the EU, the final destination, and any additional transport legs if they are known in advance. All of this increases the level of scrutiny, but also the scope for errors if information is incomplete or inconsistent."
      },
      {
        "type": "p",
        "text": "For importers, this means that timing and coordination are now critical. Catch certificates need to be in place well before goods arrive, not sent over at the last minute. There needs to be a clear understanding of who is responsible for creating the certificate, who validates it, and who checks it before the customs declaration is submitted. This is particularly important for chilled or frozen products, where delays at the border can quickly turn into commercial losses."
      },
      {
        "type": "p",
        "text": "The wider context here is that the EU is moving towards much more data-driven enforcement across all areas of trade. Systems like CATCH are not just about sustainability policy, they are about building accountability and transparency into everyday customs processes. Once everything is digital, it becomes much easier for authorities to identify patterns and spot inconsistencies. From an importer’s point of view, this raises the stakes. Good compliance now means having clean, consistent data across multiple systems, not just having the right documents on file."
      },
      {
        "type": "p",
        "text": "At Customs Wise, we are spending more time helping clients understand how CATCH fits into the broader customs picture, rather than treating it as a standalone requirement. That means reviewing supplier workflows and making sure customs declarations are aligned with what is in the new system. The aim is not just to avoid problems, but to make the process predictable and repeatable, so that fish imports can move through the border with minimal friction."
      },
      {
        "type": "p",
        "text": "As the system continues to evolve, one thing is clear. CATCH is no longer a background administrative tool. It is now a core part of how wild caught marine fish imports are controlled in the EU, and it has real operational consequences for businesses. Importers who take the time to understand it properly will be in a much stronger position than those who leave it to chance."
      },
      {
        "type": "p",
        "text": [
          "If you have any questions regarding the new CATCH system, get in touch today to speak to a member of ",
          {
            "text": "our dedicated food team",
            "href": "/food-customs"
          },
          "."
        ]
      }
    ],
    "related": [
      {
        "label": "CATCH certificates guide",
        "href": "/food-customs/catch-certificates"
      },
      {
        "label": "Food customs",
        "href": "/food-customs"
      },
      {
        "label": "TRACES & IPAFFS entries",
        "href": "/services#traces-ipaffs-entries"
      }
    ],
    "image": {
      "src": "/images/blog/new-catch-process-eu-fish-imports.jpg",
      "alt": "Fishing boats moored in a harbour",
      "width": 495,
      "height": 329
    }
  },
  // Source: Life After De Minimis.docx
  {
    "slug": "life-after-de-minimis-eu-e-commerce-imports",
    "title": "Life After De Minimis: How EU E-Commerce Imports Will Change from 2026",
    "excerpt": "The EU has confirmed that the €150 customs duty exemption will be removed, with the change expected to take effect from 2026.",
    "topic": "regulatory-updates",
    "readMinutes": 3,
    "body": [
      {
        "type": "p",
        "text": "The continued expansion of e-commerce has been one of the most significant drivers of change in international trade in recent years. Online platforms have enabled consumers to purchase goods from sellers anywhere in the world with just a few clicks, while advances in logistics and fulfilment have made rapid cross-border delivery the norm rather than the exception. This growth has been particularly pronounced in low-value consumer goods, where overseas sellers can reach EU customers directly, often at prices that domestic businesses struggle to match. A key factor in enabling this model has been the EU’s de minimis rule, which exempted imports valued under €150 from customs duties. While originally designed to reduce administrative burden for customs authorities, the rule increasingly became a commercial advantage for non-EU traders."
      },
      {
        "type": "p",
        "text": "By removing customs duties on low-value consignments, the de minimis threshold allowed foreign sellers to avoid costs that EU-based businesses could not. This created an uneven playing field, particularly in sectors dominated by fast-moving consumer goods and online marketplaces. Over time, the volume of parcels entering the EU under this exemption grew exponentially, placing strain on customs controls and contributing to lost revenue for member states. Concerns also emerged around compliance, product safety, and fair taxation. These pressures have led the EU to reassess whether the exemption remains fit for purpose in a trade environment dominated by high-volume e-commerce rather than occasional low-value imports."
      },
      {
        "type": "p",
        "text": "The EU has now confirmed that the €150 customs duty exemption will be removed, with the change expected to take effect from 2026. This represents a significant shift in how low-value e-commerce imports will be treated. Once implemented, all commercial goods entering the EU will be subject to customs duties, regardless of value. For international sellers and online marketplaces, this will require a reassessment of pricing strategies, shipping models, and customer expectations. For the customs and logistics industries, the impact will be substantial. Declaration volumes are expected to rise sharply, particularly for small parcels, and there will be increased demand for automated, compliant clearance solutions that can operate at scale without causing delays at the border."
      },
      {
        "type": "p",
        "text": "To address this challenge, the EU is placing strong emphasis on simplified customs procedures for low-value consignments. The H7 customs declaration is central to this approach, allowing for streamlined processing with reduced data requirements compared to full import declarations. This simplification is intended to support trade flow while maintaining effective customs control and revenue collection. However, simplified does not mean optional. Accurate data submission, correct classification, and proper valuation will remain essential. In parallel, handling fees and customs processing charges are expected to become a routine cost for e-commerce operators, reflecting the additional work required to process a vastly increased number of declarations."
      },
      {
        "type": "p",
        "text": "For logistics providers and customs intermediaries, this shift presents both challenges and opportunities. The ability to handle large volumes of H7 declarations efficiently, while maintaining compliance across multiple jurisdictions, will become a key differentiator. Businesses that are unprepared for the operational and regulatory demands of the new system risk delays and, increased costs."
      },
      {
        "type": "p",
        "text": "As the end of the de minimis era approaches, Customs Wise is already supporting our clients in preparing for this transition. With a dedicated H7 customs team and a wealth of experience in high-volume e-commerce movements, Customs Wise is well positioned to help your business adapt to the new rules. By combining regulatory expertise with practical solutions, we can ensure that your business can continue to trade smoothly while remaining fully compliant with evolving EU customs requirements. In a rapidly changing trade environment, preparation is essential, and here at Customs Wise we’re committed to guiding our clients through every stage of this industry-wide change."
      }
    ],
    "related": [
      {
        "label": "H7 low value consignments guide",
        "href": "/insights/blog/h7-low-value-consignments-guide"
      },
      {
        "label": "Import customs clearance",
        "href": "/services#import-customs-clearance"
      }
    ],
    "image": {
      "src": "/images/blog/life-after-de-minimis-eu-e-commerce-imports.jpg",
      "alt": "Gloved hands handling a cardboard parcel on a packing table",
      "width": 544,
      "height": 379
    }
  },
  // Source: India-uk trade deal 2025.docx
  {
    "slug": "india-uk-trade-deal-2025",
    "title": "India-UK trade deal 2025: what are the implications?",
    "excerpt": "The India-UK Trade Deal, signed in July 2025, has emerged as one of the most significant bilateral agreements for the UK since leaving the EU.",
    "topic": "trade-policy",
    "readMinutes": 3,
    "body": [
      {
        "type": "p",
        "text": "The India-UK Trade Deal, signed in July 2025, has emerged as one of the most significant bilateral agreements for the UK since leaving the EU. It brings with it tangible opportunities but also regulatory changes that directly affect British businesses exploring expansion or investment in India, as well as those connected to global supply chains."
      },
      {
        "type": "h2",
        "text": "Unpacking the India-UK Trade Agreement"
      },
      {
        "type": "p",
        "text": "This landmark Free Trade Agreement between the UK and India will slash tariffs on 90% of British products exported to India and, reciprocally, eliminate tariffs on 99% of Indian tariff lines, opening markets on a much bigger scale. For UK exporters, key product categories like whiskey, automotive machinery, electrical goods, medical devices, and various food items will see tariffs drop dramatically. Whiskey tariffs, for example, will fall from 150% to 75%, eventually dropping as low as 40% within a decade. Automotive tariffs, historically over 100%, will be cut to 10%, clearing the path for British manufacturers seeking entry into India’s growing automotive and engineering sectors."
      },
      {
        "type": "h2",
        "text": "Real-World Implications for British Businesses"
      },
      {
        "type": "p",
        "text": "This agreement is expected to increase UK-India bilateral trade as much as £25.5 billion each year, building on the already robust £43 billion trade value seen in the previous year. For British companies, these changes do more than lower costs, they streamline customs processes, with both governments pledging to release goods from customs within 48 hours provided all documentation and regulatory requirements are satisfied. The simplified procedures are designed to make British exports to India faster and far more predictable, removing any complications which may have existed in the past."
      },
      {
        "type": "p",
        "text": "Indian customs themselves are evolving, with ongoing Goods and Services Tax (GST) reforms, as well as pro-business regulatory tweaks that simplify trade and encourage strategic supply chain connections. India is positioning itself as a manufacturing and distribution hub for multinationals, not just a consumer market. For British businesses, this means easier integration into the broader Asian supply chain while also keeping compliance risks in check."
      },
      {
        "type": "p",
        "text": "The trade agreement also sets up fertile ground for the growth of several UK sectors in India:"
      },
      {
        "type": "ul",
        "items": [
          "Energy & Clean Technology: BP and Shell are investing heavily in renewable energies and EV infrastructure.",
          "Retail & Food: Marks & Spencer, Tesco, and premium food producers benefit from reduced tariffs and a more receptive consumer base.",
          "Aerospace & Engineering: Rolls-Royce, BAE Systems, and others stand to gain from diminished import duties and stronger manufacturing links to India.",
          "Higher Education: UK universities are increasingly pursuing partnerships and campus expansions, thanks to new Indian regulations permitting foreign institutions to set up local campuses."
        ]
      },
      {
        "type": "p",
        "text": "These opportunities translate into projected job creation for both nations, with 2,200 new jobs expected in the UK, especially in aerospace, technology, and advanced manufacturing."
      },
      {
        "type": "h2",
        "text": "Indian Regulations: What to Watch"
      },
      {
        "type": "p",
        "text": "Customs and regulatory processes in India have been modernizing rapidly. While there are still some complexities, recent changes such as the reforms (mentioned above) to GST have streamlined taxation. The government is committed to expedited customs clearance, though achieving this requires rigid compliance with evolving import-export documentation, valuation, licensing, and product standards. For British exporters, aligning trade practices with India’s regulatory regime is vital, and support from customs professionals is more important than ever."
      },
      {
        "type": "p",
        "text": "India’s regulatory bodies now emphasize:"
      },
      {
        "type": "ul",
        "items": [
          "Efficient paperwork and electronic filing.",
          "Accelerated customs clearance.",
          "Clear rules for cross-border taxation.",
          "Greater openness to foreign investment, particularly in strategic sectors like education and manufacturing."
        ]
      },
      {
        "type": "h2",
        "text": "The Deal’s Strategic Context"
      },
      {
        "type": "p",
        "text": "India is now the world’s fourth-largest economy and is expected to be the third-largest global importer by 2050, offering a vast and growing market. The UK views India as more than a trading partner. This deal marks a shift toward long-term growth collaboration. For British businesses, the timing couldn’t be better; as global trade tensions rise elsewhere, the UK-India corridor offers stability, transparency, and mutual ambition."
      },
      {
        "type": "h2",
        "text": "What should British businesses know when trying to navigate this new deal"
      },
      {
        "type": "ul",
        "items": [
          "Early Preparation: Get documentation and compliance practices in order as quickly as possible, as the deal is set to roll out by early 2026.",
          "Customs Planning: Take advantage of faster clearance by partnering with experienced customs experts familiar with both UK and Indian regulatory demands.",
          "Sector Focus: Identify the most promising sectors for your products. From food and drink, engineering, textiles, to energy and more."
        ]
      },
      {
        "type": "p",
        "text": "This trade agreement delivers more than just tariff cuts; it ushers in a new era of growth between the UK and India. The deal represents both opportunity and a call to proactive engagement. By understanding the regulatory landscape and leveraging sector-specific chances for expansion, British businesses of all sizes can secure their place in what is set to become a pivotal market in the coming decades."
      }
    ],
    "related": [
      {
        "label": "Export customs clearance",
        "href": "/services#export-customs-clearance"
      },
      {
        "label": "Worldwide customs clearance",
        "href": "/services#worldwide-customs-clearance"
      }
    ],
    "date": "2025-12-01"
  },
  // Source: How Businesses can take advantage of Northern Ireland's Dual Access.docx
  {
    "slug": "northern-ireland-dual-access",
    "title": "How Businesses can take advantage of Northern Ireland's Dual Access",
    "excerpt": "Northern Ireland is part of the United Kingdom but also shares a land border with the European Union, a rare advantage for food brands supplying both markets.",
    "topic": "trade-policy",
    "readMinutes": 4,
    "body": [
      {
        "type": "p",
        "text": "Northern Ireland has a truly special role in international trade. It is part of the United Kingdom but also shares a land border with the European Union through the Republic of Ireland. That position gives it a rare and powerful advantage, especially for food brands that want to supply both the EU and UK without the usual layers of complexity."
      },
      {
        "type": "h2",
        "text": "What Makes Northern Ireland So Special"
      },
      {
        "type": "p",
        "text": "When the United Kingdom left the EU, many businesses had to deal with new paperwork, customs checks, and costs. Northern Ireland, however, found itself in a very different place. Under the Northern Ireland Protocol and the Windsor Framework, the region follows EU rules for goods while remaining within the UK customs area. This means products made or distributed in Northern Ireland can move freely into both markets with minimal hassle or delay."
      },
      {
        "type": "p",
        "text": "For food businesses, this dual access is a massive advantage. Northern Ireland’s goods meet EU food safety and labeling standards, allowing them to enter the European single market easily. At the same time, the UK Internal Market Scheme ensures products move smoothly into Great Britain. Whether it’s a Belfast bakery shipping to Manchester or a dairy company in County Down exporting to France, Northern Irish businesses enjoy flexibility that simply doesn’t exist anywhere else."
      },
      {
        "type": "h2",
        "text": "Goods Coming from Great Britain to Northern Ireland"
      },
      {
        "type": "p",
        "text": "For goods moving from Great Britain into Northern Ireland, things work a little differently. Under current rules, goods entering Northern Ireland are classified as either “at risk” or “not at risk” of being sent on to the EU market. If a product is considered “at risk,” it could face EU tariffs."
      },
      {
        "type": "p",
        "text": "To manage this, the UK government introduced what is known as the Not at Risk Scheme, or UK Internal Market Scheme (UKIMS). This scheme allows registered businesses to declare goods as “not at risk” if they stay within Northern Ireland or elsewhere in the UK. In practice, that means companies bringing goods like packaged food, groceries, or retail items into Northern Ireland for use or sale locally can do so without paying EU tariffs."
      },
      {
        "type": "p",
        "text": "For example, major supermarket chains use the scheme to move goods from distribution centers in England to stores in Belfast, ensuring shelves are stocked with familiar products. Manufacturers bringing in raw materials or ingredients for processing in Northern Ireland also benefit from the same arrangement. It’s a solution that keeps supply chains functioning and business costs under control."
      },
      {
        "type": "h2",
        "text": "Why This Matters for Food Brands"
      },
      {
        "type": "p",
        "text": "For food producers and exporters, timing and quality are everything. Northern Ireland’s unique position saves time, cuts costs, and removes the duplication that comes with maintaining compliance for two separate markets. This smooth trade flow supports both small artisan brands and large agri-food companies that rely on fast supply chains and predictable logistics."
      },
      {
        "type": "p",
        "text": "The Northern Ireland Retail Movement Scheme also plays a key role in ensuring that retailers can stock the same food ranges available in the rest of the UK, maintaining consumer choice and price stability."
      },
      {
        "type": "h2",
        "text": "More Than Just Geography"
      },
      {
        "type": "p",
        "text": "Northern Ireland’s advantage is not only geographical. It has a skilled, English-speaking workforce, strong infrastructure, and a welcoming business environment that continues to attract investors. Over 1,500 international companies operate there, and many have used Northern Ireland as a strategic base to grow across the UK and Europe."
      },
      {
        "type": "p",
        "text": "Leading firms like ‘Moy Park’ and ‘Dale Farm’ have built success around this dual market access. These companies are not just moving goods; they are building global reputations for quality, consistency, and trust. Their achievements show how powerful Northern Ireland’s dual access can be for food brands that think ahead."
      },
      {
        "type": "h2",
        "text": "How Businesses Can Benefit"
      },
      {
        "type": "ul",
        "items": [
          "Move goods between Northern Ireland, the EU, and Great Britain without tariffs or long customs delays.",
          "Meet EU food safety standards once and gain access to both major markets.",
          "Use simplified processes under the UK Internal Market and Retail Movement schemes to keep operations efficient.",
          "Reach customers across 27 EU countries as well as the UK from one location.",
          "Reduce supply chain complexity and costs by centralizing production or distribution in Northern Ireland."
        ]
      },
      {
        "type": "h2",
        "text": "A Smart Choice for Businesses Beyond Northern Ireland"
      },
      {
        "type": "p",
        "text": "If your company is based elsewhere but serving both UK and EU customers, setting up in Northern Ireland can make trade much simpler. It allows smoother movement of products, fewer compliance headaches, and access to both massive markets from one well-connected base."
      },
      {
        "type": "p",
        "text": "More and more businesses across different sectors are realizing that Northern Ireland can act as a bridge where UK and EU trade genuinely come together."
      },
      {
        "type": "p",
        "text": "Northern Ireland connects two of the biggest markets in the world and makes trading between them easier than anywhere else. For food brands, this can be a turning point. The difference between slow, complicated export operations and a supply chain that simply works."
      },
      {
        "type": "p",
        "text": "With the right customs advice and local knowledge, businesses can make the most of this position, secure market access, and grow with confidence on both sides of the Irish Sea."
      },
      {
        "type": "p",
        "text": "If your business wants to explore the opportunities Northern Ireland offers, our team here at Customs Wise can help you understand the rules, simplify compliance, and guide you every step of the way."
      }
    ],
    "related": [
      {
        "label": "Food customs",
        "href": "/food-customs"
      },
      {
        "label": "Import customs clearance",
        "href": "/services#import-customs-clearance"
      },
      {
        "label": "Export customs clearance",
        "href": "/services#export-customs-clearance"
      }
    ],
    "date": "2025-10-23",
    "image": {
      "src": "/images/blog/northern-ireland-dual-access.png",
      "alt": "Map of Ireland in EU colours and Great Britain in Union flag colours, linked by a trade route",
      "width": 525,
      "height": 295
    }
  },
  // Source: A Guide for Alcohol Importers and Exporters in the UK.docx
  {
    "slug": "alcohol-importers-exporters-uk-guide",
    "title": "A Guide for Alcohol Importers and Exporters in the UK",
    "excerpt": "Key steps for importing and exporting alcohol in the UK: registration and licensing, documents, customs clearance and duty, labelling and record keeping.",
    "topic": "practical-guidance",
    "readMinutes": 3,
    "body": [
      {
        "type": "p",
        "text": "The UK alcohol market is experiencing significant growth and transformation, driven by changing consumer preferences. Recent statistics reveal that the UK drinks industry has seen a notable increase in demand, especially in premium and craft products, which now constitute a sizable share of the market. This shift towards premiumisation reflects a broader trend among consumers seeking higher-quality, distinctive beverages, which in turn influences supply chains and import/export activities. Emerging markets like India, especially its booming whisky sector, present lucrative opportunities for UK exporters. Trade agreements and tariffs tailored to promote premium UK products can make UK offerings more competitive, helping leverage India’s growing middle class and shifting consumer preferences toward premium, imported spirits. Strategic trade initiatives are thus vital to capitalise on these expanding opportunities in the global alcohol landscape, particularly as premiumisation continues to dominate consumer preferences."
      },
      {
        "type": "h2",
        "text": "Key Steps in the Import Process - Registration and Licensing"
      },
      {
        "type": "p",
        "text": "Importers must be registered with HMRC and may need specific licences, especially if importing alcohol in duty suspension or producing alcohol for commercial sale. For instance, from February 1, 2025, producers can apply for an Alcoholic Products Producer Approval (APPA), which permits the import and storage of duty-suspended alcohol. Any producer of alcoholic beverages (including spirits, wine, beer, cider, and other fermented products) must register and obtain the APPA from HMRC. This approval replaces previous excise registrations and licences related to alcohol production and allows producers to handle imports and exports legally."
      },
      {
        "type": "h2",
        "text": "Key Steps in the Export Process – Registration and Licensing"
      },
      {
        "type": "p",
        "text": "Export procedures mirror import processes but require additional certifications, such as export licences and specific labelling for international markets. Spirits like whisky must meet destination country requirements, and export documentation must certify compliance with both UK and foreign standards. Additionally, all movements of duty-suspended alcoholic products from an approved premises to export must be recorded and tracked using HMRC’s EMCS system. This ensures that duty suspension rules are properly observed during transport prior to the goods leaving the UK."
      },
      {
        "type": "h2",
        "text": "Preparing Documents and Compliance Checks"
      },
      {
        "type": "p",
        "text": "Relevant documentation is vital. An accurate commercial invoice detailing the nature, quantity, and value of the product must accompany shipments. For wine imports, although the UK has relaxed some requirements in respect of the VI-1 certificates (previously used to demonstrate compliance with EU wine production standards), it is still advisable to understand the obligations, especially for goods entering Northern Ireland where EU rules apply under the Northern Ireland Protocol. Certificates of origin and certificates of analysis might also be necessary, depending on product type and origin."
      },
      {
        "type": "h2",
        "text": "Customs Clearance and Duty Payment"
      },
      {
        "type": "p",
        "text": "Upon arrival, customs officials inspect the shipment, assess duties based on product type, alcohol strength, and origin, and process VAT payments. Effective customs clearance can be facilitated by a knowledgeable customs broker who ensures documentation accuracy, reduces delays, and manages duty payments efficiently. Excise duty on alcoholic beverages remains one of the key financial considerations. Calculations are typically based on alcohol strength and volume. Duty payments can be made upfront upon import or deferred under specific duty suspension arrangements if the goods are stored in licensed warehouses or approved premises. VAT is assessed on the total cost, including the value of goods, excise duty, and customs duty. Proper invoicing and record-keeping are crucial to accurately calculate and remit VAT."
      },
      {
        "type": "h2",
        "text": "Labelling Compliance"
      },
      {
        "type": "p",
        "text": "Proper labelling is essential to meet UK law and consumer protection standards. Labels must include the importer’s or responsible person’s UK address, ingredient lists, allergen declarations, net volume, and alcoholic strength. Non-compliance can lead to delays or rejections at customs and damage to brand reputation. There are several alcohol labelling specialists and industry regulators that offer free support and advice."
      },
      {
        "type": "h2",
        "text": "Record Keeping and Compliance Audits"
      },
      {
        "type": "p",
        "text": "It is specifically stated under excise and customs rules that records showing imports and exports of alcoholic products must be maintained and made available for up to six years to comply with legal requirements. These records support audits and compliance checks, ensuring that duties and taxes have been appropriately reported and paid. Digital record-keeping aligned with HMRC’s requirements enhances transparency and eases possible inspections."
      },
      {
        "type": "h2",
        "text": "How Customs Wise Can Help"
      },
      {
        "type": "p",
        "text": "Customs Wise streamlines the import/export process-handling documentation, customs declarations, duty calculations, and compliance checks. This not only saves time and costs but also mitigates risks associated with non-compliance or incorrect documentation. For small businesses, a customs broker can be vital in navigating complex procedures, especially when dealing with international shipments or new markets."
      },
      {
        "type": "p",
        "text": "Whether importing or exporting alcohol, working with an experienced customs broker can ensure that the process remains smooth, compliant, and cost-effective. At Customs Wise, we have a background in supporting alcohol traders with customs compliance, specifically in the wine industry."
      }
    ],
    "related": [
      {
        "label": "Import customs clearance",
        "href": "/services#import-customs-clearance"
      },
      {
        "label": "Export customs clearance",
        "href": "/services#export-customs-clearance"
      },
      {
        "label": "Customs audit",
        "href": "/services#customs-audit"
      }
    ],
    "date": "2025-10-08",
    "image": {
      "src": "/images/blog/alcohol-importers-exporters-uk-guide.jpg",
      "alt": "Racks of wine bottles stored on their sides",
      "width": 438,
      "height": 341
    }
  },
  // Source: The EU Deforestation Regulation.docx
  {
    "slug": "eu-deforestation-regulation-before-2026",
    "title": "The EU Deforestation Regulation: The EUDR What Businesses Need to Know Before 2026",
    "excerpt": "The EUDR will replace the EU Timber Regulation, setting a much higher bar for the trade of commodities associated with deforestation.",
    "topic": "regulatory-updates",
    "readMinutes": 3,
    "body": [
      {
        "type": "p",
        "text": "The EU Deforestation Regulation (EUDR), coming into effect at the end of 2025, will replace the existing EU Timber Regulation, setting a much higher bar for the trade of commodities associated with deforestation. Companies trading in wood, rubber, cattle, coffee, cocoa, soy, and palm oil, along with derived products, should be preparing now for what is one of the most ambitious sustainability measures of the decade."
      },
      {
        "type": "h2",
        "text": "Why Is the EUDR Needed?"
      },
      {
        "type": "p",
        "text": "The EU’s own consumption is estimated to account for roughly 16% of deforestation linked to international trade, according to WWF figures, making it the second-largest driver of tropical deforestation after China. Between 1990 and 2020, approximately 420 million hectares of forest-an area larger than the EU itself-were lost worldwide, primarily due to agriculture, logging, and the expansion of commodity supply chains. By targeting products placed on or exported from the EU market, EUDR aims not only to reduce the communities direct footprint but also to help lower global greenhouse gas emissions by over 30 million tonnes per year."
      },
      {
        "type": "h2",
        "text": "New Measures and Business Obligations"
      },
      {
        "type": "p",
        "text": "From December 2025, companies will no longer be able to trade relevant goods in the EU without first submitting a Due Diligence Statement, publicly declaring that products are both deforestation-free and produced legally under the laws of their country of origin. Businesses must now undertake strict due diligence, including geolocation documentation of the land where commodities were produced, risk assessments, and credible traceability procedures. Operators and traders will also be expected to use the EU’s new information system for regulatory submissions and ensure all actors in the chain of custody are compliant. For organisations used to patchwork compliance systems, this represents a major operational and technological shift."
      },
      {
        "type": "h2",
        "text": "Simplifications and Clarifications"
      },
      {
        "type": "p",
        "text": "Recognising the scale of the compliance burden, the European Commission has proposed a number of simplifications. Notably, there is now the capacity to reuse Due Diligence Statements for repeat or regular shipments, and group companies may submit on behalf of affiliates. Updates to the guidance have also clarified the circumstances under which businesses must submit annual versus consignment-specific reporting, with an emphasis on proportionality and risk-based targeting. This is intended to help SMEs and complex, multi-jurisdictional operators avoid unnecessary duplication and costs, while still holding high environmental standards front and centre. Additionally, to confirm that another supply chain entity has already completed due diligence on relevant commodities, companies should at least collect the Due Diligence Statement (DDS) reference and verification numbers from upstream partners and verify their validity through the EU Information System. Leaflets, catalogues, marketing materials, samples of negligible value, waste, and packaging are explicitly excluded from the scope of the EUDR and are not subject to its due diligence requirements."
      },
      {
        "type": "h2",
        "text": "Unintended Consequences and Drawbacks"
      },
      {
        "type": "p",
        "text": "Despite the EUDR's noble environmental objectives, several significant unintended consequences could undermine its effectiveness and create substantial challenges for both the EU and commodity producers. Market leakage poses perhaps the greatest risk, with research indicating that producers may simply redirect deforestation-linked commodities to unregulated markets rather than incur compliance costs. Ecosystem spillover represents another critical concern, as the regulation's exclusive focus on forests could inadvertently push agricultural expansion into unregulated ecosystems like Brazil's carbon-rich Cerrado savanna, potentially causing even greater environmental damage. The regulation also risks creating a small holder blind spot, potentially excluding millions of small-scale farmers who lack the technological capacity, land tenure documentation, or resources to meet GPS plotting and traceability requirements, with the Indonesian government already flagging \"serious concerns\" about administrative burdens on smallholders. Finally, the EUDR's deforestation definition may inadvertently penalise sustainable agroforestry systems, with research showing that EUDR maps claim 12% more forest globally than national data suggests, potentially labelling legitimate coffee, cocoa, and rubber agroforestry operations as non-compliant and excluding farmers practising environmentally beneficial mixed-canopy agriculture."
      },
      {
        "type": "h2",
        "text": "Conclusion"
      },
      {
        "type": "p",
        "text": "The EUDR is a landmark piece of environmental legislation that will reshape global supply chains, raise compliance expectations, and hopefully, drive meaningful progress towards ending commodity-driven deforestation. For leaders in affected sectors, early preparation, investment in traceability technology, and active engagement with supply chain partners are essential steps in the months ahead. With enforcement just around the corner, now is the time to move from awareness into action."
      }
    ],
    "related": [
      {
        "label": "EUDR explained",
        "href": "/insights/eudr"
      },
      {
        "label": "Customs audit",
        "href": "/services#customs-audit"
      }
    ],
    "date": "2025-09-16",
    "image": {
      "src": "/images/blog/eu-deforestation-regulation-before-2026.jpg",
      "alt": "Aerial view of a combine harvester working farmland at the edge of a forest",
      "width": 925,
      "height": 616,
      "caption": "View of a Combine working in agricultural land in Santa Carmem, Mato Grosso, Brazil."
    }
  },
  // Source: The End of the U.S. De Minimis Rule.docx
  {
    "slug": "end-of-us-de-minimis-rule",
    "title": "The End of the U.S. De Minimis Rule: What It Means for UK and Irish Exporters",
    "excerpt": "Goods valued under $800 could previously enter the U.S. duty-free. What the end of the U.S. de minimis rule means for UK and Irish exporters.",
    "topic": "trade-policy",
    "readMinutes": 3,
    "body": [
      {
        "type": "p",
        "text": "Previously, goods valued under $800 could enter the U.S. duty-free, speeding up customs clearance and reducing costs for small shipments from global sellers. The new executive order terminates this exemption globally (except for postal shipments, which face new duty assessment methods) and accelerates prior plans to permanently repeal the statutory de minimis exemption by July 2027. The U.S. Government points out that de minimis shipments have surged dramatically in 2025, reaching 309 million shipments by 30 June, compared to 115 million for all of 2024. Officials say this has resulted in significant revenue loss and facilitated deceptive shipping practices."
      },
      {
        "type": "h2",
        "text": "Impact on UK and Irish Businesses"
      },
      {
        "type": "p",
        "text": "For UK and Irish exporters, especially SMEs and e-commerce sellers, this policy represents a major shift with immediate cost and operational implications. Many UK and Irish retail businesses with U.S. customers have relied on de minimis to keep exports competitive and affordable by avoiding duties on lower-value parcels. The removal of this benefit means:"
      },
      {
        "type": "ul",
        "items": [
          "Increased customs duties and taxes on all shipments to the U.S.",
          "Higher logistics and compliance costs due to customs declarations, shipment valuation, and origin verification requirements.",
          "Potential delays and disruptions in supply chains, as U.S. customs will intensify scrutiny and processing for all parcel imports, not just large shipments."
        ]
      },
      {
        "type": "p",
        "text": "Trade bodies and UK Chambers of Commerce describe the change as a “bitter blow” for UK SMEs and sole traders relying on e-commerce channels to reach U.S. consumers. Businesses will need to urgently review their sales models, logistics strategies, and pricing structures to absorb or pass on new charges."
      },
      {
        "type": "p",
        "text": "Irish businesses similarly face a tougher export environment to the U.S., needing to adapt to these heightened customs duties and potentially explore alternative logistics or distribution arrangements."
      },
      {
        "type": "h2",
        "text": "Potential Changes to UK and Irish De Minimis Rules"
      },
      {
        "type": "p",
        "text": "In response to growing concerns over competition distortion by low-value imports, both the UK and the EU have been reviewing their own de minimis thresholds. In the UK, goods valued under £135 currently enter duty-free, but a government-led review initiated in 2025 aims to assess its impact on domestic retailers and the broader economy. UK trade bodies have voiced the need for reform, citing unfair advantages for overseas sellers bypassing VAT, duties, and regulatory compliance, which hurts local suppliers and jobs. Options being considered include no change, further consultations, or immediate legislative intervention."
      },
      {
        "type": "p",
        "text": "The EU’s de minimis duty exemption for imports under €150 is still in place, you don’t pay customs duty on goods below that value. However, new ICS2 rules now mean all shipments, even low-value ones, must be declared with detailed information before they arrive."
      },
      {
        "type": "h2",
        "text": "Key Takeaways for UK & Irish Exporters"
      },
      {
        "type": "ul",
        "items": [
          "Exporters must rethink logistics, Shift to bulk shipments, leverage U.S. warehousing/FTZs, and invest in supply chain technology for better visibility.",
          "UK and Irish businesses should monitor potential domestic de minimis reforms and prepare for stricter customs enforcement on low-value imports.",
          "Engaging customs brokers, trade advisors, and logistics partners will be vital to mitigate risks and optimize cross-border trade processes."
        ]
      },
      {
        "type": "p",
        "text": "Businesses selling or shipping to U.S. customers now face urgent questions about how to adjust logistics, pricing, and compliance. Our customs brokerage team is here to guide UK and Irish companies through these new rules and help streamline customs processes to minimize disruptions and cost impacts. Contact us to prepare your supply chain for the new customs landscape and maintain your global competitiveness."
      }
    ],
    "related": [
      {
        "label": "Export customs clearance",
        "href": "/services#export-customs-clearance"
      },
      {
        "label": "Worldwide customs clearance",
        "href": "/services#worldwide-customs-clearance"
      }
    ],
    "date": "2025-08-12"
  },
  // Source: Enhancing EU-Canada Trade.docx
  {
    "slug": "eu-canada-trade-trusted-trader-mra",
    "title": "Enhancing EU-Canada Trade: The Power of Trusted Trader Programmes and Customs Co-operation",
    "excerpt": "On 1 August 2025, the EU and Canada formalised a Mutual Recognition Agreement (MRA) for AEO programmes, recognising the EU’s AEO scheme and Canada’s Partners in Protection.",
    "topic": "trade-policy",
    "readMinutes": 2,
    "body": [
      {
        "type": "p",
        "text": "On 1 August 2025, the EU and Canada formalised a significant step forward in customs co-operation with the Mutual Recognition Agreement (MRA) for AEO programmes. This agreement recognises the EU’s AEO scheme and Canada’s Partners in Protection (PIP) initiative as equivalent trusted trader programmes, delivering streamlined customs processes, enhanced security, and expedited border clearance."
      },
      {
        "type": "p",
        "text": "Though this MRA is between the EU and Canada, its benefits also resonate for UK businesses engaged in transatlantic trade, thanks to interconnected supply chains and similar customs facilitation schemes applying post-Brexit."
      },
      {
        "type": "h2",
        "text": "What the MRA Means for Traders"
      },
      {
        "type": "p",
        "text": "By mutually recognising accredited operators, customs authorities can reduce inspections and prioritise compliant shipments, which cuts delays and lowers costs amid ongoing global supply chain disruptions. The agreement also fosters simplified compliance by acknowledging trusted partners’ status, eliminating duplicate checks and encouraging seamless exchange of up-to-date authorisation data."
      },
      {
        "type": "p",
        "text": "Moreover, the MRA includes a business continuity mechanism—ensuring accelerated customs clearance once trade resumes after any disruption such as border closures or security alerts."
      },
      {
        "type": "h2",
        "text": "Current UK-Canada Trade Landscape and Industry Highlights"
      },
      {
        "type": "p",
        "text": "The UK remains Canada’s third-largest trading partner, with bilateral trade valued at around £38 billion ($61 billion CAD) in 2024. Key sectors include machinery, automotive components, pharmaceuticals, and food and beverage, benefiting from tariff eliminations covering 99% of goods under the Canada-UK Trade Continuity Agreement."
      },
      {
        "type": "p",
        "text": "While tariff-free trade has preserved strong growth, agricultural sectors such as dairy and poultry still face protections limiting expansion. Investment flows between the countries—especially in technology and innovation—continue to be robust."
      },
      {
        "type": "h2",
        "text": "Leveraging CETA, Ireland, and Future UK-Canada Trade Opportunities"
      },
      {
        "type": "p",
        "text": "The EU-Canada Comprehensive Economic and Trade Agreement (CETA) remains instrumental in facilitating seamless trade, as evidenced by Ireland’s rapid export growth to Canada in pharmaceuticals, chemicals, and food sectors. This builds a compelling case for Canadian businesses using Ireland as a gateway to European markets."
      },
      {
        "type": "h2",
        "text": "Impact of US Tariffs Sparks Canada’s Strategic Shift to New Trade Partnerships"
      },
      {
        "type": "p",
        "text": "The introduction of new US tariffs and trade uncertainties prompted Canadian businesses and policymakers to actively diversify their trading relationships to reduce reliance on the US market. This shift has accelerated Canada’s pursuit of stronger trade ties with stable and tariff-friendly partners such as the UK and the European Union. With ongoing tariffs affecting key Canadian exports in sectors like steel, aluminium, and agriculture, Canada has been motivated to leverage agreements like CETA with the EU and the Trade Continuity Agreement with the UK to secure tariff-free access and supply chain reliability."
      },
      {
        "type": "p",
        "text": "These efforts not only mitigate risks posed by unpredictable American trade policies but also open new opportunities for Canadian exporters to grow in advanced markets, backed by enhanced customs facilitation and trusted trader programmes. This strategic pivot highlights the importance of diversifying trade partnerships in today’s shifting global trade environment."
      },
      {
        "type": "h2",
        "text": "How Customs Wise Supports Your Trade Success"
      },
      {
        "type": "p",
        "text": "In this evolving trade environment, understanding and utilising programmes like the MRA is key. Customs Wise offers extensive expertise in customs compliance, tariff classification, and authorised operator accreditation, helping businesses unlock the full advantages of trade agreements and facilitate efficient border crossings."
      },
      {
        "type": "p",
        "text": "Contact us today to learn how we can tailor solutions to your UK/Ireland-Canada trading needs and help you stay ahead in an increasingly complex global trade landscape."
      }
    ],
    "related": [
      {
        "label": "Worldwide customs clearance",
        "href": "/services#worldwide-customs-clearance"
      },
      {
        "label": "Export customs clearance",
        "href": "/services#export-customs-clearance"
      }
    ],
    "date": "2025-08-07"
  },
  // Source: Brexit Five Years On.docx
  {
    "slug": "brexit-five-years-on",
    "title": "Brexit Five Years On: Reflections from the Frontlines of Customs Processing",
    "excerpt": "Five years after Brexit, members of the Customs Wise team reflect on the early days of customs processing and how the industry has evolved since.",
    "topic": "trade-policy",
    "readMinutes": 4,
    "body": [
      {
        "type": "p",
        "text": "When the transition period for Brexit officially took effect on January 31, 2020, it marked a turning point for trade between the UK and the EU. The seamless movement of goods that businesses had taken for granted was suddenly replaced with customs declarations, new compliance requirements, and an array of unforeseen complications. Now, five years later, we reflect on those early days and how the industry has evolved since then, through the voices of those who experienced the transition firsthand."
      },
      {
        "type": "h2",
        "text": "A Sudden Surge: The First Days After Brexit"
      },
      {
        "type": "p",
        "text": "\"We did not know what to expect, so we were super overstaffed,\" recalls Erica. \"As it turned out, a lot of companies had bought in surplus stock to give them some extra buffer before they would need to worry about customs. We had a lot of new business interest at the time which we declined because we did not want to overextend ourselves early on—we needed to ensure the workload was sustainable for the team.\""
      },
      {
        "type": "p",
        "text": "For others, the transition was a more dramatic shift. \"It was chaos, to put it simply,\" says Klaudia. \"Overnight, companies that had been moving goods freely across borders suddenly needed full customs declarations. Many businesses were unprepared, the customs systems were overwhelmed, and there was widespread confusion.\""
      },
      {
        "type": "p",
        "text": "Yet, despite the uncertainty, some companies were better positioned to weather the storm. \"The transition period had given some businesses time to prepare,\" explains Christelle. \"Some companies sought out customs brokers ahead of time to mitigate risks and focus on their core business. Others were caught off guard, leading to confusion with paperwork and regulations.\""
      },
      {
        "type": "p",
        "text": "Frank adds, \"Although the first quarter of 2021 was a challenge, it is a testament to our amazing team and all of our colleagues in the industry, that we kept freight moving. When we live on an island and import the quantities of food that we do in Ireland, the seamless movements of goods is imperative.\""
      },
      {
        "type": "h2",
        "text": "Unforeseen Challenges and Compliance Nightmares"
      },
      {
        "type": "p",
        "text": "Among the many unexpected hurdles, handwritten customs information caused significant delays. \"Some customers would provide handwritten information and scan it over to us,\" says Erica. \"The handwriting was not always the best, so this slowed things down because we were trying to decipher information.\""
      },
      {
        "type": "p",
        "text": "For Craig, one of the biggest surprises was understanding how the Trade and Cooperation Agreement affected duties. \"It was quite shocking to learn that EU goods coming from the UK now had to be charged duty, because they were coming from a third country. Whereas in reverse, GB goods coming from the EU were also to be charged duty. Many traders assumed trade would continue as it did when the UK was part of the EU single market.\""
      },
      {
        "type": "p",
        "text": "Klaudia encountered similar misunderstandings when it came to classification. \"Many companies struggled with the rules of origin and how to classify their goods. They would often assume that their goods qualified for 0% duty or no additional controls. For example, in food clearances, oregano was often classified as a 'mixed herb' rather than the actual HS code for oregano. If this product came from Turkey, it needed additional HSE controls.\""
      },
      {
        "type": "h2",
        "text": "Moments of Relief: What Worked Smoother Than Expected?"
      },
      {
        "type": "p",
        "text": "Despite the chaos, there were some silver linings. \"The transition was definitely smoother than I anticipated because we spent months training for it,\" says Klaudia."
      },
      {
        "type": "p",
        "text": "Eoghan agrees. \"Delegation of clearances was pretty smooth. I thought there would be a lot more duplicates or issues with people processing the same shipments accidentally, but this was rarely the case.\""
      },
      {
        "type": "p",
        "text": "For Christelle, training and preparation played a significant role. \"We had received training from Frank and other customs experts in areas we were unsure about. Although we got most of the compliance issues on lock, we are always learning and seeking guidance through many channels.\""
      },
      {
        "type": "h2",
        "text": "Client Reactions: Confusion, Frustration, and Some Readiness"
      },
      {
        "type": "p",
        "text": "\"There was a bit of resistance from some customers,\" recalls Erica. \"They would push back on why we needed information and claim that a different broker didn't require it. We stuck to our guns and had to keep reiterating that compliance was key for us.\""
      },
      {
        "type": "p",
        "text": "Klaudia notes that smaller traders were particularly caught off guard. \"Many businesses had no prior experience with customs procedures and were overwhelmed by the time and cost involved. Some large companies were well-prepared, but smaller traders often found themselves completely lost.\""
      },
      {
        "type": "h2",
        "text": "Lessons from Brexit That Still Apply Today"
      },
      {
        "type": "p",
        "text": "\"Change is inevitable. You can't passively wait, you need to be proactive and prepare regardless. Expecting postponement is not a strategy—at least it shouldn't be,\" says Erica."
      },
      {
        "type": "p",
        "text": "Craig echoes this sentiment. \"Be prepared for change. Customs is ever-changing. Every year, conditions, commodity codes, and duty rates can change, as well as in response to world events that impact trade, like the Ukraine conflict.\""
      },
      {
        "type": "h2",
        "text": "The Road Ahead: Is Brexit Adjustment Complete?"
      },
      {
        "type": "p",
        "text": "\"Brexit was a shock to everyone. No one really predicted that the UK would leave the EU back in 2016, even the politicians leading the campaigns were yet to come up with a plan,\" says Craig. \"It's not every day that a country decides to leave one of the biggest trading blocs on the planet.\""
      },
      {
        "type": "p",
        "text": "Some progress has been made. \"I think Irish businesses have primarily adjusted,\" says Eoghan. \"Not sure about businesses in the UK.\""
      },
      {
        "type": "p",
        "text": "However, the road ahead is still uncertain. \"There is still a way to go, especially for industries like agriculture and food. They continue to struggle with changes to regulations,\" says Klaudia."
      },
      {
        "type": "p",
        "text": "Frank weighs in: \"Frankly, I don’t believe Customs agents have received any acknowledgement for the critical role we have played over the past four years, without being flippant.\""
      },
      {
        "type": "h2",
        "text": "Final Advice for Businesses Struggling with Compliance"
      },
      {
        "type": "p",
        "text": "\"Know your product,\" says Craig. \"Know where it comes from, how much it costs, how much it weighs, what’s in it, etc. It might sound simplistic, but it really makes a difference when it comes to ensuring that your goods can transit the border with minimal friction or delay.\""
      },
      {
        "type": "p",
        "text": "Eoghan’s advice is even more straightforward: \"Talk to Frank!\""
      },
      {
        "type": "p",
        "text": "As Brexit continues to shape trade and regulatory landscapes, one thing is clear: preparation, adaptability, and expert guidance are key to navigating the complexities of customs compliance. Businesses that take these lessons to heart will be best positioned to thrive in a post-Brexit world."
      }
    ],
    "related": [
      {
        "label": "About Customs Wise",
        "href": "/about"
      },
      {
        "label": "Import customs clearance",
        "href": "/services#import-customs-clearance"
      },
      {
        "label": "Food customs",
        "href": "/food-customs"
      }
    ],
    "date": "2025-02-12",
    "image": {
      "src": "/images/blog/brexit-five-years-on.png",
      "alt": "Portraits of Customs Wise team members Klaudia, Frank, Craig, Erica, Eoghan and Christelle",
      "width": 758,
      "height": 600
    }
  },
  // Source: Key Considerations.docx
  {
    "slug": "eudr-key-considerations",
    "title": "Key Considerations: EU Deforestation Regulation (EUDR)",
    "excerpt": "Key considerations for EU traders under the EU Deforestation Regulation (EUDR): affected commodities, supplier requirements, due diligence and the risks of non-compliance.",
    "topic": "regulatory-updates",
    "readMinutes": 2,
    "body": [
      {
        "type": "p",
        "text": "Starting in December 2024, the EU Deforestation Regulation (EUDR) will replace the EU Timber Regulation (EUTR). EUDR aims to minimize the environmental impact of consumer goods by promoting the consumption of ‘deforestation-free’ products which is expected to bring down greenhouse gas emissions and biodiversity loss."
      },
      {
        "type": "h2",
        "text": "What is the EUDR?"
      },
      {
        "type": "p",
        "text": "Like the Carbon Border Adjustment Mechanism (CBAM), the EUDR is designed to mitigate the environmental impact of products originating from or produced outside the EU."
      },
      {
        "type": "p",
        "text": "This regulation sets forestry standards for imported goods and disqualifies suppliers who fail to meet these standards. Additionally, exporters from the EU must demonstrate that their cargo has not contributed to forest degradation."
      },
      {
        "type": "p",
        "text": "The affected commodities include cocoa, coffee, rubber, soy, beef and timber, as well as derivatives such as processed meats, leather, chocolate, soybeans, paper, and printed books. Please note that this list is not exhaustive, and existing EU green supply chain initiatives, like the Forest Law Enforcement Government and Trade (FLEGT) license for paper from certain sources, may still apply in conjunction with EUDR."
      },
      {
        "type": "h2",
        "text": "What are The Aims of EUDR?"
      },
      {
        "type": "ul",
        "items": [
          "avoid contribution to deforestation and forest degradation in the EU and globally",
          "reduce carbon emissions caused by EU consumption and production of the relevant commodities by at least 32 million metric tonnes a year",
          "address all deforestation driven by agricultural expansion to produce the commodities in the scope of the regulation, as well as forest degradation"
        ]
      },
      {
        "type": "h2",
        "text": "What’s Required of Your Suppliers Under the EU Deforestation Regulation (EUDR)?"
      },
      {
        "type": "p",
        "text": "You must provide exact coordinates showing where the timber products in your shipment originated, ensuring the land was not deforested after 2020."
      },
      {
        "type": "p",
        "text": "Beyond deforestation regulations, EUDR mandates that suppliers adhere to standards related to welfare, biodiversity protection, anti-corruption, and the rights outlined in the UN Declaration on the Rights of Indigenous People. Furthermore, EUDR requires that any deforestation complies with the legal standards of the country of origin. According to a report from the Forest Policy Trade and Finance Initiative, only about 30% of commercial deforestation between 2013 and 2019 was legal."
      },
      {
        "type": "h2",
        "text": "Your Obligations & Risks as an EU Trader"
      },
      {
        "type": "p",
        "text": "Although the responsibility lies with your suppliers to meet the EU Deforestation Regulation standards, you are accountable for placing these goods on the EU market."
      },
      {
        "type": "p",
        "text": "Thus, you must perform due diligence on suppliers and provide a statement to your national authority confirming this."
      },
      {
        "type": "p",
        "text": "Your due diligence should include:"
      },
      {
        "type": "ul",
        "items": [
          "Collecting detailed info to ensure your products comply.",
          "Conducting a risk assessment for each product.",
          "Implementing risk mitigation measures, such as independent surveys and working with suppliers on improvements."
        ]
      },
      {
        "type": "p",
        "text": "If a supplier fails to meet EUDR requirements, you must find an alternative that does."
      },
      {
        "type": "p",
        "text": "As the importer, you are responsible for issuing a statement proving due diligence for each import shipment and passing the reference number of the statement to any downstream operators in your supply chain. A similar statement is required for EUDR goods exported from the EU."
      },
      {
        "type": "p",
        "text": "Compliance checks from your national authority, may come without warning and they may demand immediate corrective action if noncompliance is found."
      },
      {
        "type": "p",
        "text": "Non-compliance can result in:"
      },
      {
        "type": "ul",
        "items": [
          "Confiscation of goods.",
          "Temporary exclusion from public procurement and funding.",
          "Temporary prohibition from trading EUDR goods.",
          "Increased due diligence reporting requirements.",
          "Fines of up to 4% of your previous year’s EU turnover."
        ]
      }
    ],
    "related": [
      {
        "label": "EUDR explained",
        "href": "/insights/eudr"
      },
      {
        "label": "CBAM for UK and Irish importers",
        "href": "/insights/cbam"
      }
    ],
    "date": "2024-07-01",
    "image": {
      "src": "/images/blog/eudr-key-considerations.png",
      "alt": "Felled tree stumps and logs in a woodland",
      "width": 456,
      "height": 456
    }
  },
  // Source: Agri Food UK Export Guide.docx
  {
    "slug": "agri-food-uk-export-guide",
    "title": "Agri Food UK Export Guide",
    "excerpt": "To import live animals or animal products from non-EU countries into Great Britain, find the Border Target Operating Model (TOM) risk category and follow its SPS rules.",
    "topic": "food-customs",
    "readMinutes": 1,
    "body": [
      {
        "type": "p",
        "text": "To import live animals or animal products from non-EU countries into Great Britain, you’ll need to: Find the Border Target Operating Model (TOM) risk category for the commodity you’re importing & follow the sanitary and phytosanitary (SPS) rules for that import risk category. The TOM categorises live animals, germinal products, products of animal origin (POAO) and animal by-products (ABPs) as high risk, medium risk or low risk."
      },
      {
        "type": "h2",
        "text": "TOM Risk Categories in Britain"
      },
      {
        "type": "h3",
        "text": "Low TOM risk category"
      },
      {
        "type": "p",
        "text": "Continue to use IPAFFS to notify authorities before goods arrive in GB, ensuring that the point of entry has a BCP designed to check your commodity. You will not need a health certificate, consignments will not be subject to routine documentary, identity and physical checks unless intelligence indicates a risk."
      },
      {
        "type": "h3",
        "text": "Medium TOM risk category"
      },
      {
        "type": "p",
        "text": "Continue to use IPAFFS to notify authorities before the goods arrive in GB. The consignment will continue to need a health certificate issued by the competent authority in the country where the goods originate. Products will continue to enter through a BCP and be subject to documentary, identity and physical import checks."
      },
      {
        "type": "h3",
        "text": "High TOM risk category"
      },
      {
        "type": "p",
        "text": "Continue to use IPAFFS to notify authorities before the goods arrive in GB. The consignment will continue to need a health certificate issued by the competent authority in the country where the goods originate. Most consignments in the high TOM risk category are already subject to documentary, identity and physical import checks. These checks will continue."
      }
    ],
    "related": [
      {
        "label": "Importing POAO",
        "href": "/food-customs/products-of-animal-origin"
      },
      {
        "label": "TRACES & IPAFFS entries",
        "href": "/services#traces-ipaffs-entries"
      },
      {
        "label": "Food customs",
        "href": "/food-customs"
      }
    ],
    "date": "2024-06-05",
    "image": {
      "src": "/images/blog/agri-food-uk-export-guide.png",
      "alt": "Raw chicken, beef, eggs, cheese and milk laid out on a table",
      "width": 401,
      "height": 274
    }
  },
  // Source: Do You Understand CBAM Reporting.docx
  {
    "slug": "cbam-reporting",
    "title": "Do You Understand CBAM Reporting?",
    "excerpt": "Compliance with CBAM is mandatory for the Authorised CBAM Declarant and indirect customs representatives. What CBAM reporting involves.",
    "topic": "regulatory-updates",
    "readMinutes": 1,
    "body": [
      {
        "type": "p",
        "text": "Compliance with CBAM is mandatory for the ‘Authorised CBAM Declarant’ (importer of record for CBAM goods imported into the EU Customs Union) and indirect customs representatives."
      },
      {
        "type": "p",
        "text": "EU importers of goods covered by CBAM (such as steel, aluminium, electricity, fertiliser and cement) will register with national authorities where they can buy CBAM certificates. EU importers will declare the emissions embedded in their imports and surrender the corresponding number of certificates each year."
      },
      {
        "type": "p",
        "text": "CBAM will mandatorily apply to EU customers, so you will have to shift away from non-cooperative suppliers (to minimise the financial and non-financial burdens of non-compliance with CBAM). If an importer can prove that a carbon price has already been paid during the production of the imported goods the corresponding amount can be deducted."
      },
      {
        "type": "p",
        "text": "Failure to fulfil CBAM reporting obligations and inaccurately disclosing embedded emissions can lead to a financial penalty ranging from €10-€50 for each tonne of unreported embedded emissions. Higher penalties will be applied where the duration of failure exceeds 6 months. The accuracy of CBAM reports will be reliant upon supplier-provided data. To mitigate risk, importers should impose contractual conditions, holding suppliers accountable for the accuracy of CBAM data."
      },
      {
        "type": "p",
        "text": "Customs Wise has a CBAM reporting service."
      }
    ],
    "related": [
      {
        "label": "CBAM for UK and Irish importers",
        "href": "/insights/cbam"
      },
      {
        "label": "Customs audit",
        "href": "/services#customs-audit"
      }
    ],
    "date": "2024-06-05",
    "image": {
      "src": "/images/blog/cbam-reporting.jpg",
      "alt": "Laptop showing charts beside a calculator on a desk",
      "width": 486,
      "height": 351
    }
  },
  // Source: EU Centralised Clearance.docx
  {
    "slug": "eu-centralised-clearance",
    "title": "EU Centralised Clearance",
    "excerpt": "EU Centralised Customs Clearance allows economic operators to declare goods in one Member State while they are physically imported or exported in another.",
    "topic": "regulatory-updates",
    "readMinutes": 1,
    "body": [
      {
        "type": "p",
        "text": "EU Centralised Customs Clearance allows economic operators to declare goods in one Member State (Supervising Member State). These goods can be physically imported / exported in a different Member State (Participating Member State). Centralised clearance allows economic operators to centralise the accounting and payment of Customs Duties for all their customs transactions in the Supervising Member State."
      },
      {
        "type": "p",
        "text": "The Benefits for your Business:"
      },
      {
        "type": "ol",
        "items": [
          "Fewer checks and declarations required for the more transparent and compliant traders.",
          "The most reliable (‘trust and check’) traders can work with one customs administration and one data hub.",
          "Traders utilising the system will save time & money.",
          "Importation without customs intervention will be possible for trust and check traders."
        ]
      },
      {
        "type": "p",
        "text": "To benefit from EU centralised clearances, there are some authorisations and requirements that your organisation must have:"
      },
      {
        "type": "ol",
        "items": [
          "Authorised Economic Operator (AEO) status.",
          "Digital customs process.",
          "Permission from each member state you are clearing in."
        ]
      }
    ],
    "related": [
      {
        "label": "Worldwide customs clearance",
        "href": "/services#worldwide-customs-clearance"
      },
      {
        "label": "Import customs clearance",
        "href": "/services#import-customs-clearance"
      }
    ],
    "date": "2024-06-05",
    "image": {
      "src": "/images/blog/eu-centralised-clearance.jpg",
      "alt": "Customs clearance document beside a calculator and pen",
      "width": 363,
      "height": 260
    }
  },
  // Source: H7 Low Value Consignments Guide.docx
  {
    "slug": "h7-low-value-consignments-guide",
    "title": "H7 Low Value Consignments Guide",
    "excerpt": "It is possible to declare goods up to the intrinsic value of €150 using the H7 customs declaration, which also allows you to use IOSS.",
    "topic": "regulatory-updates",
    "readMinutes": 1,
    "body": [
      {
        "type": "p",
        "text": "It is possible to declare goods up to/ equal to the intrinsic value of €150 using the H7 customs declaration."
      },
      {
        "type": "p",
        "text": "This declaration requires 3 times less data than a standard declaration & allows you to use IOSS and VAT special Arrangements."
      },
      {
        "type": "p",
        "text": "The IOSS allows a taxable person to register in a single Member State to declare, and pay, EU import VAT."
      },
      {
        "type": "p",
        "text": "When utilising IOSS, import VAT is not collected by Customs it is remitted through a monthly IOSS return. The IOSS can be used to declare and pay, the import VAT due where: the goods are located outside the EU at the time they are sold, the goods are dispatched in consignments of an intrinsic value not exceeding €150 & the goods are not subject to excise duties."
      },
      {
        "type": "p",
        "text": "A supplier registered for the IOSS will be able to: register in one Member State for all goods within the scope of the IOSS made across the EU, report and remit all import VAT due under the IOSS across the EU in one monthly return & charge VAT at the applicable rate, at the point of sale, to the consumer. This removes further tax or customs charges upon delivery of the goods for the consumer."
      },
      {
        "type": "p",
        "text": "EU suppliers can register directly for the IOSS in their own Member State. Non-EU suppliers will need to appoint an EU established intermediary to avail of the IOSS. Customs Wise is a registered IOSS intermediary. We can take responsibility for the customs declaration & payment of VAT processed under IOSS."
      }
    ],
    "related": [
      {
        "label": "Life after de minimis",
        "href": "/insights/blog/life-after-de-minimis-eu-e-commerce-imports"
      },
      {
        "label": "Import customs clearance",
        "href": "/services#import-customs-clearance"
      }
    ],
    "date": "2024-06-05",
    "image": {
      "src": "/images/blog/h7-low-value-consignments-guide.png",
      "alt": "Person shopping for clothes online on a phone and laptop",
      "width": 536,
      "height": 366
    }
  },
  // Source: Multi Country Customs Broker Integration.docx
  {
    "slug": "multi-country-customs-broker-integration",
    "title": "Multi Country Customs Broker Integration",
    "excerpt": "Manage customs clearance for multiple countries on one platform, with partners from the AEB customs broker network in more than 20 countries.",
    "topic": "practical-guidance",
    "readMinutes": 1,
    "body": [
      {
        "type": "p",
        "text": "End-to-end digitisation of customs clearance, cut costs and add greater visibility to your current process. 20+ countries supported, allowing you to manage customs clearance for multiple countries on one platform."
      },
      {
        "type": "p",
        "text": [
          "Reliable customs broker services are key in your international growth. Together with partners from the ",
          {
            "text": "AEB customs broker network",
            "href": "/services#worldwide-customs-clearance"
          },
          ", we will get your goods through customs in more than 20 countries quickly and efficiently. The AEB customs broker partners are experts on national customs regulations. They keep track of regulatory changes and are available to provide support and advice."
        ]
      },
      {
        "type": "p",
        "text": "You will enjoy the benefit of working with just one partner, which means you can skip the time-consuming process of finding and onboarding with new reliable broker partners in the countries you are exporting to. Take the shortest route to global trade."
      },
      {
        "type": "p",
        "text": [
          "Work with Customs Wise, a member of the ",
          {
            "text": "AEB customs broker network",
            "href": "/services#worldwide-customs-clearance"
          },
          "."
        ]
      }
    ],
    "related": [
      {
        "label": "Worldwide customs clearance",
        "href": "/services#worldwide-customs-clearance"
      },
      {
        "label": "Export customs clearance",
        "href": "/services#export-customs-clearance"
      }
    ],
    "date": "2024-06-05",
    "image": {
      "src": "/images/blog/multi-country-customs-broker-integration.jpg",
      "alt": "Group of people standing behind large red AEB letters outside a building",
      "width": 618,
      "height": 280
    }
  },
  // Source: Post Clearance Checks.docx
  {
    "slug": "post-clearance-checks-origin",
    "title": "Post Clearance Checks: Origin",
    "excerpt": "One of the most important post-clearance checks is origin, which is relevant when determining the rate of duty applicable to goods.",
    "topic": "practical-guidance",
    "readMinutes": 1,
    "body": [
      {
        "type": "p",
        "text": "A number of common checks should be initiated to ensure the validity and accuracy of SADs. One of the most important checks is related to origin."
      },
      {
        "type": "p",
        "text": "The country of origin is relevant when determining the rate of duty applicable on goods originating from a particular country. Incorrect declaration of the country of origin can result in false claims for preferential rates of duty / avoidance of restrictions / avoidance of the application of anti-dumping duty."
      },
      {
        "type": "p",
        "text": "GB / UK origin is only applicable to goods that are being dispatched from the UK, that have been manufactured or modified substantially in order to change their origin. For example, a Japanese car being painted in the UK, won’t be able to claim preference because a substantial transformation has not taken place. However if it was an engine that was imported and fitted to a UK vehicle, then preferential origin would be applied to the vehicle as a whole under bilateral accumulation. It is important that the invoice or an accompanying document includes the following statement:"
      },
      {
        "type": "callout",
        "text": "(Period: from___________ to __________ (1)) The exporter of the products covered by this document (Exporter Reference No ... (2)) declares that, except where otherwise clearly indicated, these products are of ...... (3) preferential origin. ……….....… (4) (Place and date)………........ (Name of the exporter)"
      },
      {
        "type": "p",
        "text": "Code U116 should be used when the above statement is included. U117 should be used in the case of importers knowledge. It is important to note that you must have proof to back up your origin claim or duty may be applicable."
      }
    ],
    "related": [
      {
        "label": "Customs audit",
        "href": "/services#customs-audit"
      },
      {
        "label": "Import customs clearance",
        "href": "/services#import-customs-clearance"
      }
    ],
    "date": "2024-06-05",
    "image": {
      "src": "/images/blog/post-clearance-checks-origin.png",
      "alt": "Person reviewing documents with a magnifying glass and pen",
      "width": 448,
      "height": 296
    }
  },
  // Source: Second Hand MachinerY.docx
  {
    "slug": "second-hand-machinery-import-export-guide",
    "title": "Second Hand Machinery: Import / Export Guide",
    "excerpt": "Requirements for importing second hand agricultural machinery from Britain and exporting it to Britain, including phytosanitary certificates and CHED-PP.",
    "topic": "practical-guidance",
    "readMinutes": 1,
    "body": [
      {
        "type": "h2",
        "text": "Requirements for Importing from Britain"
      },
      {
        "type": "ul",
        "items": [
          "Register with the Department of Agriculture & TRACES NT.",
          "A phytosanitary certificate is required, and will be provided by the UK’s National Plant Protection Organisation (NPPO).",
          "All documents are to be submitted to the Department at least 24 hours before arrival of consignment; Part 1 of TRACES NT’s Common Health Entry Documents for Plants and Plant Products (CHED-PP) must be completed, physical checks on arrival."
        ]
      },
      {
        "type": "h2",
        "text": "Requirements for Exporting to Britain"
      },
      {
        "type": "ul",
        "items": [
          "Register with the Department of Agriculture",
          "A phytosanitary certificate, must be applied for through the department 14 days before the departure of the consignment & must be sent to the British buyer before departure of the consignment",
          "The British buyer must submit documents to the authorities at least 4 hours in advance of arrival if traveling by air, and 1 day if traveling by road / sea."
        ]
      },
      {
        "type": "h2",
        "text": "Important to Note"
      },
      {
        "type": "p",
        "text": "Machinery subject to these requirements include: tractors, horticultural / forestry machinery for soil preparation / cultivation, harvesting / threshing machinery (including straw / fodder balers), grass / hay mowers, machines for cleaning / sorting / grading eggs, fruit or other agricultural produce, poultry / bee-keeping machinery (including germination plant fitted with mechanical or thermal equipment) and poultry incubators & brooders. The machinery must be clean & free of soil / plant debris."
      }
    ],
    "related": [
      {
        "label": "TRACES & IPAFFS entries",
        "href": "/services#traces-ipaffs-entries"
      },
      {
        "label": "Fresh produce and plant health",
        "href": "/food-customs/fresh-produce"
      }
    ],
    "date": "2024-06-05",
    "image": {
      "src": "/images/blog/second-hand-machinery-import-export-guide.png",
      "alt": "Green tractor in a field",
      "width": 581,
      "height": 396
    }
  },
];

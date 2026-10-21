# Exploration Notes: techdome.io

## Navigation
- Header: logo (-> /), Services, Portfolio, Insights, Company (looks like dropdown menus [TO VERIFY: hover/click each]), "Book call" (-> /contact), "Contact Us" (-> /contact)
- Footer Services: /studio, /studio#mvp, /staff-augmentation, /staff-augmentation#role-react-nextjs, /staff-augmentation#role-nodejs-backend, /automation, /gcc, /automation#ai-voice-agents
- Footer Industries: /work?domain=Healthcare, Enterprise & ERP, AI & Automation, FinTech, Consumer & Marketplace, Public Sector, EdTech & Education (all end with #case-studies)
- Footer Products: /products/sparrow, justinterview-ai, saral-funding, geolytics, aether-voice, catalyst, arc
- Footer Company: /about, /work, /insights, /topics, /glossary, /newsletter, /life-at-techdome, /careers, /faq
- Also: /privacy, /terms, /sitemap.xml, /services
- Broken/blank links: [TO VERIFY: click each in the browser]

## Homepage
- Page title (tab): "Techdome: Custom Software Development & Venture Studio"
- Meta description: "Techdome is a custom software development company and venture studio. MVPs, dedicated engineering pods and n8n and AI automation from 110+ engineers."
- Hero: label "PRODUCT VENTURE STUDIO", heading "Your product team, fully assembled."
- Hero text: "We build software ventures two ways: our own products, and yours..."
- Hero stats: 7+ in-house ventures, 40+ client ventures, 100% Job Success on Upwork, 110+ engineers
- CTAs: "Book a product teardown" (-> /contact), "See what we've built" (-> /work)
- Other CTAs: "How we build new products" (-> /studio), "Start a conversation" (-> /contact), "Book a 30-minute scoping call" (-> /contact), "Explore All Blogs" (-> /insights), "Read the case studies" (-> /work), "See GCC services" (-> /gcc), "Meet the studio" (-> /about), "Explore automation" (-> /automation), "Scale your pod" (-> /staff-augmentation)
- External links: Upwork profile, Product Hunt (Sparrow), Clutch, n8n.io creator page (Rahul Joshi), WhatsApp (/go/whatsapp, +91 9652049922)
- Sections: product list (7 products), 41 case studies, 7 blog cards, services (3), FAQ, testimonials, compliance, team (CEO Rahul Joshi, CTO Gaurav Chouhan)
- Newsletter: "Subscribe" button with email input [TO VERIFY: success and error messages]

## Contact / enquiry form (/contact)
- Page title (tab): "Contact Us | Techdome"
- Heading: "Talk to an architect. 30 minutes." / form heading "Let's find you a time."
- Fields: First name *, Last name, Work email *, Company, plus a "Website" label (unclear if it is a field or tab) [TO VERIFY]
- Button: "Next" (looks like a multi-step form, next step probably time slot) [TO VERIFY]
- Other links on page: "Existing client" (/contact?for=client), "Student or learner" (/contact?for=student)
- Contact: rahul.joshi@techdome.net.in, +91 9652049922
- Empty submit: [TO VERIFY: click Next with empty fields, note the error text]
- Invalid email (e.g. abc): [TO VERIFY]
- Valid submit: NOT submitted on purpose (live site, would send a real enquiry)

## Footer
- Social icons: LinkedIn, X, Instagram, GitHub, Facebook, Clutch, Upwork
- Footer also has: "Cookie settings", Privacy, Terms, Sitemap, WhatsApp number
- Copyright: "© Copyright 2026, All Rights Reserved by Techdome"
- Do the social links work: [TO VERIFY: click each]

## Mobile
- Viewport meta: width=device-width, initial-scale=1
- 375px: [TO VERIFY: does nav become a hamburger? any horizontal scroll? text cut off?]
- 768px: [TO VERIFY: layout, nav, hero]

## Console and Network
- Red console errors: [TO VERIFY: F12 -> Console, reload home and /contact]
- Third-party scripts: [TO VERIFY: F12 -> Network -> filter JS, look for analytics, chat, fonts, cookie banner]
- Site is built with Next.js (image URLs use /_next/image)

## Odd things / possible bugs (to verify)
- /contact browser tab title is "Contact Us | Techdome" but og:title is "Talk to an Architect: 30-Minute Scoping Call | Techdome" (mismatch)
- Header has both "Book call" and "Contact Us" going to the same /contact page
- All 7 blog cards show the same date "Oct 15, 2026"
- "Website" label on contact form is unclear [TO VERIFY]
- Case study cards and "Hire React developers" use anchors (#role-react-nextjs): [TO VERIFY: do they scroll to the right section?]
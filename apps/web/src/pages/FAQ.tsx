import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function FAQ() {
  return (
    <div className="min-h-screen bg-background py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-serif font-bold mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-muted-foreground mb-8">Everything you need to know about Casa Corona.</p>
          
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input 
              placeholder="Search for answers..." 
              className="pl-12 h-14 rounded-full bg-muted/30 border-transparent shadow-sm text-base"
            />
          </div>
        </div>

        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-serif font-bold mb-6 pb-2 border-b">For Customers</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger className="text-base font-semibold">How do I book an appointment?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                  Currently, Casa Corona acts as a discovery platform. You can find the business you like and use the contact information or WhatsApp buttons on their profile to book directly with them.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger className="text-base font-semibold">Are the reviews real?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                  Yes, we take review authenticity seriously. Only users who have booked and completed a service through our integrated partners can leave verified reviews.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>

          <div>
            <h2 className="text-2xl font-serif font-bold mb-6 pb-2 border-b">For Vendors</h2>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-3">
                <AccordionTrigger className="text-base font-semibold">How do I list my business?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                  Click the "List Your Business" button in the navigation bar to create an account. You'll need to provide details about your services, pricing, and photos of your work for approval.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4">
                <AccordionTrigger className="text-base font-semibold">What is the "Verified" badge?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed text-base">
                  The green Verified badge indicates that our team has manually reviewed the business, confirmed their physical location, and verified their business registration documents.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </div>
  );
}

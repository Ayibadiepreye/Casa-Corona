import { useState, useRef, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Chrome, Eye, EyeOff, Upload, X, Plus, CheckCircle2, Building2, User, ArrowRight, ArrowLeft, Image } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { categoryApi, Category } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

// ─── Password strength ────────────────────────────────────────────────────────
function GoogleLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
    </svg>
  );
}

function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "", color: "" };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  if (score <= 1) return { score, label: "Weak", color: "bg-destructive" };
  if (score <= 3) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score === 4) return { score, label: "Good", color: "bg-blue-500" };
  return { score, label: "Strong", color: "bg-green-500" };
}

// ─── Schemas ──────────────────────────────────────────────────────────────────
const roleSchema = z.object({
  role: z.enum(["customer", "vendor"]),
});

const accountSchema = z.object({
  name: z.string().min(2, "Full name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(10, "Valid phone number is required"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  terms: z.boolean().refine((v) => v === true, "You must accept the Terms of Service"),
});

const businessProfileSchema = z.object({
  businessName: z.string().min(2, "Business name is required"),
  categoryId: z.string().min(1, "Please select a category"),
  city: z.string().min(2, "City is required"),
  state: z.string().min(2, "State is required"),
  address: z.string().optional(),
  bio: z.string().min(20, "Please write at least 20 characters about your business"),
  website: z.string().url("Enter a valid URL").optional().or(z.literal("")),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  tiktok: z.string().optional(),
});

const businessDetailsSchema = z.object({
  yearsInBusiness: z.string().optional(),
  teamSize: z.string().optional(),
  priceRange: z.string().optional(),
  serviceArea: z.string().optional(),
  whatsapp: z.string().optional(),
  openingHours: z.string().optional(),
});

const productSchema = z.object({
  productName: z.string().min(2, "Product/service name is required"),
  productCategory: z.string().min(1, "Select a category"),
  productPrice: z.string().min(1, "Price is required"),
  productDescription: z.string().min(10, "Please describe this product or service"),
  productDuration: z.string().optional(),
});

const NIGERIAN_STATES = [
  "Abia","Adamawa","Akwa Ibom","Anambra","Bauchi","Bayelsa","Benue","Borno",
  "Cross River","Delta","Ebonyi","Edo","Ekiti","Enugu","FCT Abuja","Gombe",
  "Imo","Jigawa","Kaduna","Kano","Katsina","Kebbi","Kogi","Kwara","Lagos",
  "Nasarawa","Niger","Ogun","Ondo","Osun","Oyo","Plateau","Rivers","Sokoto",
  "Taraba","Yobe","Zamfara"
];

const YEARS_OPTIONS = ["Less than 1 year","1-2 years","3-5 years","6-10 years","10+ years"];
const TEAM_SIZE_OPTIONS = ["Solo (just me)","2-5 people","6-10 people","11-25 people","26+ people"];
const PRICE_RANGE_OPTIONS = ["Budget (₦0 - ₦5,000)","Mid-range (₦5,000 - ₦20,000)","Premium (₦20,000 - ₦50,000)","Luxury (₦50,000+)"];

// ─── Step progress bar ───────────────────────────────────────────────────────
type StepInfo = { label: string; step: number };

function StepProgress({ steps, current }: { steps: StepInfo[]; current: number }) {
  return (
    <div className="w-full mb-8">
      <div className="flex items-center justify-between mb-2">
        {steps.map((s, i) => (
          <div key={s.step} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all",
                current > s.step ? "bg-primary text-primary-foreground" :
                current === s.step ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                "bg-muted text-muted-foreground"
              )}>
                {current > s.step ? <CheckCircle2 className="w-4 h-4" /> : s.step}
              </div>
              <span className={cn(
                "text-[10px] font-medium hidden sm:block whitespace-nowrap",
                current === s.step ? "text-primary" : "text-muted-foreground"
              )}>{s.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={cn(
                "flex-1 h-0.5 mx-1 mb-4 transition-all",
                current > s.step ? "bg-primary" : "bg-muted"
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Image upload ────────────────────────────────────────────────────────────
function ImageUpload({ images, onAdd, onRemove, max = 5 }: {
  images: string[];
  onAdd: (url: string) => void;
  onRemove: (idx: number) => void;
  max?: number;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).slice(0, max - images.length).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => { if (ev.target?.result) onAdd(ev.target.result as string); };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {images.map((src, i) => (
          <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border group">
            <img src={src} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onRemove(i)}
              className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <X className="w-3 h-3 text-white" />
            </button>
          </div>
        ))}
        {images.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1 hover:border-primary/50 hover:bg-primary/5 transition-colors"
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-[10px] text-muted-foreground">Add</span>
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleFile} />
      <p className="text-xs text-muted-foreground">Upload up to {max} photos. JPG, PNG or WEBP. Max 5MB each.</p>
    </div>
  );
}

// ─── Step 1: Role ─────────────────────────────────────────────────────────────
function StepRole({ onNext }: { onNext: (role: "customer" | "vendor") => void }) {
  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: { role: "customer" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => onNext(v.role))} className="space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-serif font-bold mb-1">Who are you?</h2>
          <p className="text-muted-foreground text-sm">Choose how you want to use Casa Corona</p>
        </div>

        <FormField control={form.control} name="role" render={({ field }) => (
          <FormItem>
            <FormControl>
              <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-2 gap-4">
                <FormItem className="space-y-0">
                  <FormControl>
                    <RadioGroupItem value="customer" className="sr-only" />
                  </FormControl>
                  <FormLabel
                    onClick={() => field.onChange("customer")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all hover:border-primary/50",
                      field.value === "customer" ? "border-primary bg-primary/5" : "border-border bg-background"
                    )}
                  >
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", field.value === "customer" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      <User className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Customer</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Book beauty & wellness services</p>
                    </div>
                    {field.value === "customer" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </FormLabel>
                </FormItem>

                <FormItem className="space-y-0">
                  <FormControl>
                    <RadioGroupItem value="vendor" className="sr-only" />
                  </FormControl>
                  <FormLabel
                    onClick={() => field.onChange("vendor")}
                    className={cn(
                      "flex flex-col items-center gap-3 p-5 rounded-2xl border-2 cursor-pointer transition-all hover:border-primary/50",
                      field.value === "vendor" ? "border-primary bg-primary/5" : "border-border bg-background"
                    )}
                  >
                    <div className={cn("w-14 h-14 rounded-full flex items-center justify-center", field.value === "vendor" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground")}>
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div className="text-center">
                      <p className="font-semibold">Professional</p>
                      <p className="text-xs text-muted-foreground mt-0.5">List your business & get bookings</p>
                    </div>
                    {field.value === "vendor" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </FormLabel>
                </FormItem>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <Button type="submit" className="w-full rounded-full h-12 text-base">
          Continue <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </form>
    </Form>
  );
}

// ─── Step 2: Account Info ─────────────────────────────────────────────────────
function StepAccount({ onNext, onBack, defaultValues }: {
  onNext: (values: z.infer<typeof accountSchema>) => void;
  onBack: () => void;
  defaultValues?: Partial<z.infer<typeof accountSchema>>;
}) {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<z.infer<typeof accountSchema>>({
    resolver: zodResolver(accountSchema),
    defaultValues: { name: "", email: "", phone: "", password: "", terms: false, ...defaultValues },
  });
  const password = form.watch("password");
  const strength = getPasswordStrength(password);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-serif font-bold mb-1">Your Account</h2>
          <p className="text-muted-foreground text-sm">Your personal login credentials</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="name" render={({ field }) => (
            <FormItem className="col-span-2">
              <FormLabel>Full Name</FormLabel>
              <FormControl><Input placeholder="Jane Doe" className="bg-background h-11" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="email" render={({ field }) => (
            <FormItem className="col-span-2 sm:col-span-1">
              <FormLabel>Email Address</FormLabel>
              <FormControl><Input type="email" placeholder="jane@example.com" className="bg-background h-11" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="phone" render={({ field }) => (
            <FormItem className="col-span-2 sm:col-span-1">
              <FormLabel>Phone Number</FormLabel>
              <FormControl><Input type="tel" placeholder="+234 800 000 0000" className="bg-background h-11" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="password" render={({ field }) => (
          <FormItem>
            <FormLabel>Password</FormLabel>
            <FormControl>
              <div className="relative">
                <Input type={showPassword ? "text" : "password"} placeholder="••••••••" className="bg-background h-11 pr-11" {...field} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </FormControl>
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1,2,3,4,5].map((i) => (
                    <div key={i} className={cn("h-1 flex-1 rounded-full transition-all", i <= strength.score ? strength.color : "bg-muted")} />
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Strength: <span className="font-medium text-foreground">{strength.label}</span></p>
              </div>
            )}
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="terms" render={({ field }) => (
          <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-2">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
            <div className="leading-none">
              <FormLabel className="text-sm font-normal text-muted-foreground">
                I agree to the <Link href="/terms" className="text-primary hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
              </FormLabel>
              <FormMessage />
            </div>
          </FormItem>
        )} />

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 rounded-full h-12">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button type="submit" className="flex-2 rounded-full h-12 px-8">
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Step 3: Business Profile ──────────────────────────────────────────────────
function StepBusinessProfile({ onNext, onBack, defaultValues, categories }: {
  onNext: (values: z.infer<typeof businessProfileSchema>) => void;
  onBack: () => void;
  defaultValues?: Partial<z.infer<typeof businessProfileSchema>>;
  categories: Category[];
}) {
  const form = useForm<z.infer<typeof businessProfileSchema>>({
    resolver: zodResolver(businessProfileSchema),
    defaultValues: { businessName: "", categoryId: "", city: "", state: "", address: "", bio: "", website: "", instagram: "", facebook: "", tiktok: "", ...defaultValues },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-serif font-bold mb-1">Business Profile</h2>
          <p className="text-muted-foreground text-sm">Tell clients about your business</p>
        </div>

        <FormField control={form.control} name="businessName" render={({ field }) => (
          <FormItem>
            <FormLabel>Business Name <span className="text-destructive">*</span></FormLabel>
            <FormControl><Input placeholder="e.g. Lumière Beauty Studio" className="bg-background h-11" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="categoryId" render={({ field }) => (
          <FormItem>
            <FormLabel>Primary Category <span className="text-destructive">*</span></FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger className="bg-background h-11"><SelectValue placeholder="Select your main service category" /></SelectTrigger></FormControl>
              <SelectContent>
                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="city" render={({ field }) => (
            <FormItem>
              <FormLabel>City <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input placeholder="e.g. Victoria Island" className="bg-background h-11" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="state" render={({ field }) => (
            <FormItem>
              <FormLabel>State <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="bg-background h-11"><SelectValue placeholder="State" /></SelectTrigger></FormControl>
                <SelectContent>{NIGERIAN_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="address" render={({ field }) => (
          <FormItem>
            <FormLabel>Street Address <Badge variant="outline" className="ml-2 text-[10px]">Optional</Badge></FormLabel>
            <FormControl><Input placeholder="e.g. 12 Adeola Odeku Street" className="bg-background h-11" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <FormField control={form.control} name="bio" render={({ field }) => (
          <FormItem>
            <FormLabel>Business Description <span className="text-destructive">*</span></FormLabel>
            <FormControl><Textarea placeholder="Tell clients what makes your business special, your expertise, and what services you offer..." className="bg-background min-h-[100px] resize-none" {...field} /></FormControl>
            <FormDescription className="text-xs">{field.value?.length || 0} / 500 characters</FormDescription>
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-3">
          <div className="text-sm font-medium">Social & Online Presence <Badge variant="outline" className="ml-2 text-[10px]">Optional</Badge></div>
          <FormField control={form.control} name="website" render={({ field }) => (
            <FormItem>
              <FormControl><Input placeholder="https://yourbusiness.com" className="bg-background h-10" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-3 gap-3">
            <FormField control={form.control} name="instagram" render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder="@instagram" className="bg-background h-10 text-sm" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="facebook" render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder="Facebook" className="bg-background h-10 text-sm" {...field} /></FormControl>
              </FormItem>
            )} />
            <FormField control={form.control} name="tiktok" render={({ field }) => (
              <FormItem>
                <FormControl><Input placeholder="@tiktok" className="bg-background h-10 text-sm" {...field} /></FormControl>
              </FormItem>
            )} />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 rounded-full h-12">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button type="submit" className="flex-2 rounded-full h-12 px-8">
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Step 4: Business Details ──────────────────────────────────────────────────
function StepBusinessDetails({ onNext, onBack, defaultValues }: {
  onNext: (values: z.infer<typeof businessDetailsSchema>) => void;
  onBack: () => void;
  defaultValues?: Partial<z.infer<typeof businessDetailsSchema>>;
}) {
  const form = useForm<z.infer<typeof businessDetailsSchema>>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: { yearsInBusiness: "", teamSize: "", priceRange: "", serviceArea: "", whatsapp: "", openingHours: "", ...defaultValues },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onNext)} className="space-y-5">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-serif font-bold mb-1">Business Details</h2>
          <p className="text-muted-foreground text-sm">Help clients find and trust your business <span className="text-primary font-medium">(all optional)</span></p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="yearsInBusiness" render={({ field }) => (
            <FormItem>
              <FormLabel>Years in Business</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="bg-background h-11"><SelectValue placeholder="How long?" /></SelectTrigger></FormControl>
                <SelectContent>{YEARS_OPTIONS.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
          <FormField control={form.control} name="teamSize" render={({ field }) => (
            <FormItem>
              <FormLabel>Team Size</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="bg-background h-11"><SelectValue placeholder="How many?" /></SelectTrigger></FormControl>
                <SelectContent>{TEAM_SIZE_OPTIONS.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="priceRange" render={({ field }) => (
          <FormItem>
            <FormLabel>Price Range</FormLabel>
            <Select onValueChange={field.onChange} defaultValue={field.value}>
              <FormControl><SelectTrigger className="bg-background h-11"><SelectValue placeholder="What's your typical price range?" /></SelectTrigger></FormControl>
              <SelectContent>{PRICE_RANGE_OPTIONS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
          </FormItem>
        )} />

        <FormField control={form.control} name="serviceArea" render={({ field }) => (
          <FormItem>
            <FormLabel>Service Area</FormLabel>
            <FormControl><Input placeholder="e.g. Lagos Island, Victoria Island, Ikoyi" className="bg-background h-11" {...field} /></FormControl>
            <FormDescription className="text-xs">Areas you serve or travel to for home visits</FormDescription>
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="whatsapp" render={({ field }) => (
            <FormItem>
              <FormLabel>WhatsApp Number</FormLabel>
              <FormControl><Input placeholder="+234 800 000 0000" className="bg-background h-11" {...field} /></FormControl>
            </FormItem>
          )} />
          <FormField control={form.control} name="openingHours" render={({ field }) => (
            <FormItem>
              <FormLabel>Opening Hours</FormLabel>
              <FormControl><Input placeholder="e.g. Mon–Sat, 9am–7pm" className="bg-background h-11" {...field} /></FormControl>
            </FormItem>
          )} />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 rounded-full h-12">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button type="submit" className="flex-2 rounded-full h-12 px-8">
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </form>
    </Form>
  );
}

// ─── Step 5: First Product ─────────────────────────────────────────────────────
function StepFirstProduct({ onNext, onBack, businessCategory, categories }: {
  onNext: (values: z.infer<typeof productSchema> | null, images: string[]) => void;
  onBack: () => void;
  businessCategory?: string;
  categories: Category[];
}) {
  const [images, setImages] = useState<string[]>([]);
  const form = useForm<z.infer<typeof productSchema>>({
    resolver: zodResolver(productSchema),
    defaultValues: { productName: "", productCategory: businessCategory || "", productPrice: "", productDescription: "", productDuration: "" },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit((v) => onNext(v, images))} className="space-y-5">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-serif font-bold mb-1">Add Your First Listing</h2>
          <p className="text-muted-foreground text-sm">List a service or product to attract clients right away</p>
        </div>

        <FormField control={form.control} name="productName" render={({ field }) => (
          <FormItem>
            <FormLabel>Service / Product Name <span className="text-destructive">*</span></FormLabel>
            <FormControl><Input placeholder="e.g. Knotless Braids, Full Glam Makeup" className="bg-background h-11" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="productCategory" render={({ field }) => (
            <FormItem>
              <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl><SelectTrigger className="bg-background h-11"><SelectValue placeholder="Category" /></SelectTrigger></FormControl>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="productPrice" render={({ field }) => (
            <FormItem>
              <FormLabel>Price (₦) <span className="text-destructive">*</span></FormLabel>
              <FormControl><Input type="number" placeholder="e.g. 15000" className="bg-background h-11" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )} />
        </div>

        <FormField control={form.control} name="productDuration" render={({ field }) => (
          <FormItem>
            <FormLabel>Duration <Badge variant="outline" className="ml-2 text-[10px]">Optional</Badge></FormLabel>
            <FormControl><Input placeholder="e.g. 2 hours, 45 mins, N/A for products" className="bg-background h-11" {...field} /></FormControl>
          </FormItem>
        )} />

        <FormField control={form.control} name="productDescription" render={({ field }) => (
          <FormItem>
            <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
            <FormControl><Textarea placeholder="Describe what's included, any requirements, or what makes this special..." className="bg-background min-h-[90px] resize-none" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Image className="w-4 h-4 text-muted-foreground" />
            <div className="text-sm font-medium">Product / Service Photos <Badge variant="outline" className="ml-1 text-[10px]">Optional</Badge></div>
          </div>
          <ImageUpload
            images={images}
            onAdd={(url) => setImages(prev => [...prev, url])}
            onRemove={(i) => setImages(prev => prev.filter((_, idx) => idx !== i))}
            max={5}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={onBack} className="flex-1 rounded-full h-12">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back
          </Button>
          <Button type="submit" className="flex-2 rounded-full h-12 px-6">
            Continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
        <Button type="button" variant="ghost" onClick={() => onNext(null, [])} className="w-full text-muted-foreground text-sm h-10">
          Skip for now — I'll add listings later
        </Button>
      </form>
    </Form>
  );
}

// ─── Collected data type ───────────────────────────────────────────────────────
interface SignupData {
  role: "customer" | "vendor";
  account?: z.infer<typeof accountSchema>;
  businessProfile?: z.infer<typeof businessProfileSchema>;
  businessDetails?: z.infer<typeof businessDetailsSchema>;
  product?: z.infer<typeof productSchema> | null;
  productImages?: string[];
}

// ─── Step 6: Review & Submit ──────────────────────────────────────────────────
function StepReview({ data, onSubmit, onBack, submitting }: {
  data: SignupData;
  onSubmit: () => void;
  onBack: () => void;
  submitting: boolean;
}) {
  const Row = ({ label, value }: { label: string; value?: string | null }) =>
    value ? (
      <div className="flex justify-between gap-4 text-sm py-1.5 border-b last:border-0">
        <span className="text-muted-foreground shrink-0">{label}</span>
        <span className="font-medium text-right truncate">{value}</span>
      </div>
    ) : null;

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-serif font-bold mb-1">Review Your Profile</h2>
        <p className="text-muted-foreground text-sm">Check everything looks right before submitting</p>
      </div>

      {/* Account */}
      <div className="rounded-xl border p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Account</p>
        <Row label="Name" value={data.account?.name} />
        <Row label="Email" value={data.account?.email} />
        <Row label="Phone" value={data.account?.phone} />
      </div>

      {/* Business profile */}
      {data.businessProfile && (
        <div className="rounded-xl border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Business Profile</p>
          <Row label="Business Name" value={data.businessProfile.businessName} />
          <Row label="Location" value={`${data.businessProfile.city}, ${data.businessProfile.state}`} />
          <Row label="Website" value={data.businessProfile.website || undefined} />
          <Row label="Instagram" value={data.businessProfile.instagram || undefined} />
          <div className="text-sm py-1.5">
            <span className="text-muted-foreground block mb-1">Description</span>
            <p className="font-medium text-xs leading-relaxed line-clamp-3">{data.businessProfile.bio}</p>
          </div>
        </div>
      )}

      {/* Business details */}
      {data.businessDetails && (
        <div className="rounded-xl border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Business Details</p>
          <Row label="Years in Business" value={data.businessDetails.yearsInBusiness || undefined} />
          <Row label="Team Size" value={data.businessDetails.teamSize || undefined} />
          <Row label="Price Range" value={data.businessDetails.priceRange || undefined} />
          <Row label="WhatsApp" value={data.businessDetails.whatsapp || undefined} />
          <Row label="Opening Hours" value={data.businessDetails.openingHours || undefined} />
        </div>
      )}

      {/* First listing */}
      {data.product && (
        <div className="rounded-xl border p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">First Listing</p>
          <Row label="Name" value={data.product.productName} />
          <Row label="Price" value={`₦${Number(data.product.productPrice).toLocaleString()}`} />
          <Row label="Duration" value={data.product.productDuration || undefined} />
          <div className="text-sm py-1.5">
            <span className="text-muted-foreground block mb-1">Description</span>
            <p className="font-medium text-xs leading-relaxed line-clamp-2">{data.product.productDescription}</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1 rounded-full h-12" disabled={submitting}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Back
        </Button>
        <Button type="button" onClick={onSubmit} className="flex-2 rounded-full h-12 px-6" disabled={submitting}>
          {submitting ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />Creating account…</>
          ) : (
            <>Submit Application <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </Button>
      </div>
    </div>
  );
}

// ─── Main Signup Component ────────────────────────────────────────────────────
export default function Signup() {
  const { signUp } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<SignupData>({ role: "customer" });
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Load categories from API on mount
  useEffect(() => {
    categoryApi.list().then(setCategories).catch(() => {
      // fallback: leave empty — Select will show placeholder
    });
  }, []);

  const vendorSteps = [
    { step: 1, label: "Role" },
    { step: 2, label: "Account" },
    { step: 3, label: "Business" },
    { step: 4, label: "Details" },
    { step: 5, label: "Listings" },
    { step: 6, label: "Review" },
    { step: 7, label: "Verify" },
  ];

  const customerSteps = [
    { step: 1, label: "Role" },
    { step: 2, label: "Account" },
    { step: 3, label: "Verify" },
  ];

  const isVendor = data.role === "vendor";
  // For display purposes, map vendor step 7 (redirected) back to 7
  const steps = isVendor ? vendorSteps : customerSteps;
  const displayStep = step;

  const handleRoleNext = (role: "customer" | "vendor") => {
    setData({ role });
    setStep(2);
  };

  const handleAccountNext = async (account: z.infer<typeof accountSchema>) => {
    setData(prev => ({ ...prev, account }));
    localStorage.setItem("signupEmail", account.email);
    if (!isVendor) {
      try {
        await signUp({ name: account.name, email: account.email, password: account.password, role: "customer", phone: account.phone });
        setLocation("/verify-email");
      } catch (e: any) {
        if (e.status === 409) {
          toast({
            title: "Email already registered",
            description: "This email is already registered. Try signing in instead.",
            variant: "destructive"
          });
        } else {
          throw e; // let AuthContext handle other errors
        }
      }
    } else {
      setStep(3);
    }
  };

  const handleBusinessProfileNext = (businessProfile: z.infer<typeof businessProfileSchema>) => {
    setData(prev => ({ ...prev, businessProfile }));
    setStep(4);
  };

  const handleBusinessDetailsNext = (businessDetails: z.infer<typeof businessDetailsSchema>) => {
    setData(prev => ({ ...prev, businessDetails }));
    setStep(5);
  };

  const handleProductNext = (product: z.infer<typeof productSchema> | null, productImages: string[]) => {
    setData(prev => ({ ...prev, product, productImages }));
    setStep(6); // go to Review, not straight to verify
  };

  const handleSubmit = async () => {
    if (!data.account) return;
    setSubmitting(true);
    try {
      localStorage.setItem("signupEmail", data.account.email);
      // Store vendor onboarding data so VendorDashboard can pick it up after OTP verify
      if (data.businessProfile) {
        localStorage.setItem("vendorOnboarding", JSON.stringify({
          businessProfile: data.businessProfile,
          businessDetails: data.businessDetails,
          product: data.product,
          productImages: data.productImages,
        }));
      }
      await signUp({
        name: data.account.name,
        email: data.account.email,
        password: data.account.password,
        role: "vendor",
        phone: data.account.phone,
      });
      setLocation("/verify-email");
    } catch (e: any) {
      if (e.status === 409) {
        toast({
          title: "Email already registered",
          description: "This email is already registered. Try signing in instead.",
          variant: "destructive"
        });
      } else {
        throw e; // let AuthContext handle other errors
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-card border rounded-2xl p-6 sm:p-8 shadow-sm w-full">
      <StepProgress steps={steps} current={displayStep} />

      {step === 1 && <StepRole onNext={handleRoleNext} />}
      {step === 2 && (
        <StepAccount
          onNext={handleAccountNext}
          onBack={() => setStep(1)}
          defaultValues={data.account}
        />
      )}
      {step === 3 && isVendor && (
        <StepBusinessProfile
          onNext={handleBusinessProfileNext}
          onBack={() => setStep(2)}
          defaultValues={data.businessProfile}
          categories={categories}
        />
      )}
      {step === 4 && isVendor && (
        <StepBusinessDetails
          onNext={handleBusinessDetailsNext}
          onBack={() => setStep(3)}
          defaultValues={data.businessDetails}
        />
      )}
      {step === 5 && isVendor && (
        <StepFirstProduct
          onNext={handleProductNext}
          onBack={() => setStep(4)}
          businessCategory={data.businessProfile?.categoryId}
          categories={categories}
        />
      )}
      {step === 6 && isVendor && (
        <StepReview
          data={data}
          onSubmit={handleSubmit}
          onBack={() => setStep(5)}
          submitting={submitting}
        />
      )}

      {step === 1 && (
        <>
          <div className="relative py-5">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or sign up with</span>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="w-full h-12 rounded-full hover:bg-muted/50 relative"
            onClick={() => { window.location.href = `${import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1"}/auth/google`; }}
          >
            <GoogleLogo className="w-5 h-5 absolute left-4" />
            Continue with Google
          </Button>
        </>
      )}

      <div className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="text-primary font-medium hover:underline">Log in</Link>
      </div>
    </div>
  );
}

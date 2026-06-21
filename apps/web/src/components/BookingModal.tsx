import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Clock, CheckCircle, Phone, User, MessageSquare, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/utils";
import { bookingApi } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

type Service = {
  id: string | number;
  name: string;
  description: string;
  price: number;
  duration: string;
};

type Vendor = {
  id?: string;        // real vendor id (optional for backward compat)
  name: string;
  logo: string;
  city: string;
  state: string;
};

type BookingModalProps = {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  services: Service[];
  preSelectedService?: Service | null;
};

const TIME_SLOTS = [
  { label: "9:00 AM",  hour: 9  },
  { label: "10:00 AM", hour: 10 },
  { label: "11:00 AM", hour: 11 },
  { label: "12:00 PM", hour: 12 },
  { label: "1:00 PM",  hour: 13 },
  { label: "2:00 PM",  hour: 14 },
  { label: "3:00 PM",  hour: 15 },
  { label: "4:00 PM",  hour: 16 },
  { label: "5:00 PM",  hour: 17 },
  { label: "6:00 PM",  hour: 18 },
];

function getNext7Days() {
  const days: Date[] = [];
  const now = new Date();
  for (let i = 1; i <= 7; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    days.push(d);
  }
  return days;
}

const DAY_NAMES   = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function BookingModal({ isOpen, onClose, vendor, services, preSelectedService }: BookingModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(preSelectedService ? 2 : 1);
  const [selectedService, setSelectedService] = useState<Service | null>(preSelectedService ?? null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<typeof TIME_SLOTS[0] | null>(null);
  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const days = getNext7Days();

  const resetState = () => {
    setStep(preSelectedService ? 2 : 1);
    setSelectedService(preSelectedService ?? null);
    setSelectedDate(null);
    setSelectedTimeSlot(null);
    setName(user?.name ?? "");
    setPhone(user?.phone ?? "");
    setEmail(user?.email ?? "");
    setNotes("");
    setSubmitted(false);
    setConfirming(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetState, 300);
  };

  const handleSubmit = async () => {
    if (!name || !phone || !email) return;
    setConfirming(true);

    // If we have real vendor.id and service.id (UUIDs), call the real API
    const isRealBooking =
      vendor.id &&
      selectedService &&
      typeof selectedService.id === "string" &&
      selectedService.id.includes("-");

    if (isRealBooking && selectedDate && selectedTimeSlot) {
      // Build ISO datetime from selected date + time slot
      const scheduledFor = new Date(selectedDate);
      scheduledFor.setHours(selectedTimeSlot.hour, 0, 0, 0);

      try {
        await bookingApi.create({
          vendorId: vendor.id!,
          serviceId: String(selectedService!.id),
          scheduledFor: scheduledFor.toISOString(),
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          notes: notes || undefined,
        });
        setSubmitted(true);
      } catch (e: any) {
        toast({
          title: "Booking failed",
          description: e.message ?? "Something went wrong. Please try again.",
          variant: "destructive",
        });
      } finally {
        setConfirming(false);
      }
    } else {
      // Fallback for pages where vendor.id isn't passed (e.g., demo mode)
      await new Promise(r => setTimeout(r, 1200));
      setConfirming(false);
      setSubmitted(true);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="fixed inset-x-0 bottom-0 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:max-w-lg sm:w-full z-50 mx-0"
          >
            <div className="bg-background rounded-t-3xl sm:rounded-2xl shadow-2xl border overflow-hidden max-h-[90vh] flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden border bg-muted shrink-0">
                    <img src={vendor.logo} alt={vendor.name} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="font-bold text-sm leading-tight">{vendor.name}</p>
                    <p className="text-xs text-muted-foreground">{vendor.city}, {vendor.state}</p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Step indicator */}
              {!submitted && (
                <div className="flex items-center gap-2 px-6 pt-4 shrink-0">
                  {[1, 2, 3].map((s) => (
                    <div key={s} className={`h-1 flex-1 rounded-full transition-all duration-300 ${s <= step ? "bg-primary" : "bg-muted"}`} />
                  ))}
                </div>
              )}

              {/* Body */}
              <div className="flex-1 overflow-y-auto">
                {submitted ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center text-center py-12 px-6 gap-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-serif font-bold">Request Sent!</h3>
                    <p className="text-muted-foreground text-sm max-w-xs">
                      Your booking request for <strong>{selectedService?.name}</strong> at <strong>{vendor.name}</strong> has been sent. They'll confirm with you shortly.
                    </p>
                    <div className="w-full bg-muted/40 border rounded-xl p-4 text-sm text-left space-y-2 mt-2">
                      <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{selectedService?.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{selectedDate ? `${DAY_NAMES[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}` : ""}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedTimeSlot?.label ?? ""}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold text-primary">{selectedService ? formatNaira(selectedService.price) : ""}</span></div>
                    </div>
                    <Button className="w-full rounded-full mt-2" onClick={handleClose}>Done</Button>
                  </motion.div>
                ) : (
                  <div className="px-6 pb-6">
                    {/* Step 1: Choose Service */}
                    {step === 1 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="pt-4 space-y-3"
                      >
                        <h3 className="font-bold text-base mb-4">Select a Service</h3>
                        {services.map((service) => (
                          <button
                            key={String(service.id)}
                            onClick={() => { setSelectedService(service); setStep(2); }}
                            className={`w-full text-left p-4 rounded-xl border transition-all hover:border-primary/60 hover:bg-primary/5 ${selectedService?.id === service.id ? "border-primary bg-primary/5" : "border-border"}`}
                          >
                            <div className="flex justify-between items-start gap-3">
                              <div className="flex-1">
                                <p className="font-semibold text-sm mb-0.5">{service.name}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">{service.description}</p>
                                {service.duration && (
                                  <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                                    <Clock size={11} />
                                    {service.duration}
                                  </div>
                                )}
                              </div>
                              <span className="font-bold font-serif text-base shrink-0">{formatNaira(service.price)}</span>
                            </div>
                          </button>
                        ))}
                      </motion.div>
                    )}

                    {/* Step 2: Date & Time */}
                    {step === 2 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="pt-4 space-y-5"
                      >
                        {selectedService && (
                          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl text-sm">
                            <span className="font-medium">{selectedService.name}</span>
                            <div className="flex items-center gap-3">
                              {selectedService.duration && (
                                <span className="text-muted-foreground flex items-center gap-1"><Clock size={12} />{selectedService.duration}</span>
                              )}
                              <span className="font-bold text-primary">{formatNaira(selectedService.price)}</span>
                            </div>
                          </div>
                        )}

                        <div>
                          <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                            <Calendar size={15} className="text-primary" /> Choose a Date
                          </h4>
                          <div className="grid grid-cols-7 gap-1.5">
                            {days.map((day, i) => (
                              <button
                                key={i}
                                onClick={() => setSelectedDate(day)}
                                className={`flex flex-col items-center p-2 rounded-xl text-xs font-medium transition-all ${
                                  selectedDate?.toDateString() === day.toDateString()
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 hover:bg-muted text-foreground"
                                } ${day.getDay() === 0 ? "opacity-40 pointer-events-none" : ""}`}
                              >
                                <span className="text-[10px] mb-0.5 opacity-70">{DAY_NAMES[day.getDay()]}</span>
                                <span className="text-sm font-bold">{day.getDate()}</span>
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">Sundays are not available</p>
                        </div>

                        {selectedDate && (
                          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                            <h4 className="font-bold text-sm mb-3 flex items-center gap-2">
                              <Clock size={15} className="text-primary" /> Choose a Time
                            </h4>
                            <div className="grid grid-cols-4 gap-2">
                              {TIME_SLOTS.map((slot) => (
                                <button
                                  key={slot.label}
                                  onClick={() => setSelectedTimeSlot(slot)}
                                  className={`py-2 px-1 rounded-xl text-xs font-medium border transition-all ${
                                    selectedTimeSlot?.label === slot.label
                                      ? "border-primary bg-primary text-primary-foreground"
                                      : "border-border hover:border-primary/60 hover:bg-primary/5"
                                  }`}
                                >
                                  {slot.label}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </motion.div>
                    )}

                    {/* Step 3: Contact Details */}
                    {step === 3 && (
                      <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="pt-4 space-y-4"
                      >
                        <div className="p-3 bg-muted/50 rounded-xl text-sm space-y-1.5">
                          <div className="flex justify-between"><span className="text-muted-foreground">Service</span><span className="font-medium">{selectedService?.name}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{selectedDate ? `${DAY_NAMES[selectedDate.getDay()]}, ${selectedDate.getDate()} ${MONTH_NAMES[selectedDate.getMonth()]}` : ""}</span></div>
                          <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-medium">{selectedTimeSlot?.label ?? ""}</span></div>
                          <div className="flex justify-between border-t pt-1.5 mt-1.5"><span className="font-medium">Total</span><span className="font-bold text-primary">{selectedService ? formatNaira(selectedService.price) : ""}</span></div>
                        </div>

                        <div className="space-y-3">
                          <div className="relative">
                            <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="Your full name" className="pl-9 rounded-xl h-11" value={name} onChange={e => setName(e.target.value)} />
                          </div>
                          <div className="relative">
                            <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                            <Input placeholder="+234 800 000 0000" className="pl-9 rounded-xl h-11" value={phone} onChange={e => setPhone(e.target.value)} />
                          </div>
                          <div className="relative">
                            <MessageSquare size={15} className="absolute left-3 top-3.5 text-muted-foreground" />
                            <textarea
                              placeholder="Any notes or requests (optional)"
                              className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border bg-background resize-none h-20 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring transition-colors"
                              value={notes}
                              onChange={e => setNotes(e.target.value)}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer nav */}
              {!submitted && (
                <div className="px-6 pb-6 pt-3 border-t shrink-0 flex gap-3">
                  {step > 1 && (
                    <Button variant="outline" className="rounded-full px-4 gap-1.5" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)}>
                      <ChevronLeft size={16} /> Back
                    </Button>
                  )}
                  {step === 1 && (
                    <Button variant="outline" className="rounded-full px-4" onClick={handleClose}>Cancel</Button>
                  )}
                  {step < 3 ? (
                    <Button
                      className="rounded-full flex-1 gap-1.5"
                      disabled={step === 1 ? !selectedService : step === 2 ? !selectedDate || !selectedTimeSlot : false}
                      onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)}
                    >
                      Continue <ChevronRight size={16} />
                    </Button>
                  ) : (
                    <Button
                      className="rounded-full flex-1"
                      disabled={!name || !phone || !email || confirming}
                      onClick={handleSubmit}
                    >
                      {confirming ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                          Confirming...
                        </span>
                      ) : "Confirm Booking"}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

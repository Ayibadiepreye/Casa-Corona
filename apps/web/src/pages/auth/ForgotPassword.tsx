import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { KeyRound } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  email: z.string().email("Valid email is required"),
});

export default function ForgotPassword() {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    toast({
      title: "Reset link sent",
      description: "If an account exists with this email, you will receive a password reset link.",
    });
    form.reset();
  };

  return (
    <div className="bg-card border rounded-2xl p-6 sm:p-10 shadow-sm">
      <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-6">
        <KeyRound className="w-8 h-8" />
      </div>

      <h1 className="text-2xl font-serif font-bold mb-2 text-center">Reset Password</h1>
      <p className="text-muted-foreground text-center mb-8">Enter your email address and we'll send you a link to reset your password.</p>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="jane@example.com" className="bg-background h-11" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button type="submit" className="w-full rounded-full h-12 text-base">
            Send Reset Link
          </Button>
        </form>
      </Form>

      <div className="mt-8 text-center text-sm">
        <Link href="/login" className="text-muted-foreground hover:text-foreground font-medium hover:underline">
          Back to login
        </Link>
      </div>
    </div>
  );
}

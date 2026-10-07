"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  name: z.string().min(2, "Enter your full name"),
  phone: z.string().min(7, "Enter a valid phone number"),
  url: z
    .string()
    .min(3, "Enter a website URL")
    .refine((v) => /^(https?:\/\/)?[^\s]+\.[a-z]{2,}([/?#].*)?$/i.test(v.trim()), "Enter a valid website URL"),
});

export type LeadFormData = z.infer<typeof formSchema>;

export function UrlForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (data: LeadFormData) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<LeadFormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", phone: "", url: "" },
  });

  const submit = form.handleSubmit((values) => {
    let url = values.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    onSubmit({ ...values, url });
  });

  return (
    <div className="flex w-full flex-col items-start gap-6 font-sans">
      <form onSubmit={submit} className="w-full max-w-xl space-y-6">
        
        <div className="space-y-6 border border-border bg-card p-8">
          <div className="space-y-2 text-left border-b border-border pb-6">
            <h3 className="text-2xl font-bold tracking-tight text-foreground uppercase">Start your analysis</h3>
            <p className="text-sm text-muted-foreground uppercase tracking-widest">Enter details for a free audit.</p>
          </div>

          <div className="space-y-5 pt-4">
            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold">Full Name</label>
              <Input
                {...form.register("name")}
                placeholder="YOUR NAME"
                className="h-12 border-border bg-background text-base rounded-none focus-visible:ring-1 focus-visible:ring-primary uppercase placeholder:text-muted-foreground/50"
                disabled={isSubmitting}
              />
              {form.formState.errors.name && (
                <p className="mt-1.5 text-xs text-destructive text-left">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold">Phone Number</label>
              <Input
                {...form.register("phone")}
                placeholder="YOUR PHONE"
                type="tel"
                className="h-12 border-border bg-background text-base rounded-none focus-visible:ring-1 focus-visible:ring-primary uppercase placeholder:text-muted-foreground/50"
                disabled={isSubmitting}
              />
              {form.formState.errors.phone && (
                <p className="mt-1.5 text-xs text-destructive text-left">{form.formState.errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs uppercase tracking-widest font-bold">Website URL</label>
              <Input
                {...form.register("url")}
                placeholder="EXAMPLE.COM"
                className="h-12 border-border bg-background text-base rounded-none focus-visible:ring-1 focus-visible:ring-primary uppercase placeholder:text-muted-foreground/50"
                disabled={isSubmitting}
              />
              {form.formState.errors.url && (
                <p className="mt-1.5 text-xs text-destructive text-left">{form.formState.errors.url.message}</p>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            size="lg" 
            className="mt-6 w-full h-14 gap-3 rounded-none bg-primary text-primary-foreground hover:bg-primary/90 font-bold uppercase tracking-widest" 
            disabled={isSubmitting}
          >
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Analyze Website"}
            {!isSubmitting && <ArrowRight className="size-4" />}
          </Button>
        </div>
      </form>
    </div>
  );
}

"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowRight, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const formSchema = z.object({
  url: z
    .string()
    .min(3, "Enter a website URL")
    .refine((v) => /^(https?:\/\/)?[^\s]+\.[a-z]{2,}([/?#].*)?$/i.test(v.trim()), "Enter a valid website URL"),
});

const EXAMPLE_URLS = ["stripe.com", "linear.app", "vercel.com", "notion.so", "airbnb.com"];

export function UrlForm({
  onSubmit,
  isSubmitting,
}: {
  onSubmit: (url: string) => void;
  isSubmitting: boolean;
}) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { url: "" },
  });

  const submit = form.handleSubmit((values) => {
    let url = values.url.trim();
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`;
    }
    onSubmit(url);
  });

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <form onSubmit={submit} className="w-full max-w-2xl">
        <div className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card/50 p-2 shadow-sm backdrop-blur sm:flex-row">
          <Input
            {...form.register("url")}
            placeholder="yourwebsite.com"
            autoFocus
            className="h-12 flex-1 border-0 bg-transparent px-4 text-base shadow-none focus-visible:ring-0"
            disabled={isSubmitting}
          />
          <Button type="submit" size="lg" className="h-12 gap-2 rounded-xl px-6" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Analyze"}
            {!isSubmitting && <ArrowRight className="size-4" />}
          </Button>
        </div>
        {form.formState.errors.url && (
          <p className="mt-2 text-center text-sm text-destructive">{form.formState.errors.url.message}</p>
        )}
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2 mt-4 text-xs text-muted-foreground">
        <span>Try:</span>
        {EXAMPLE_URLS.map((url) => (
          <button
            key={url}
            type="button"
            className="rounded-full border border-border/50 px-2.5 py-1 transition-colors hover:border-border hover:text-foreground"
            onClick={() => onSubmit(`https://${url}`)}
            disabled={isSubmitting}
          >
            {url}
          </button>
        ))}
      </div>
    </div>
  );
}

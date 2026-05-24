import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FormField } from "@/components/common/FormField";
import { getApiErrorMessage } from "@/api/helpers";
import { useAuth } from "@/hooks/useAuth";
import { useSubmitRsvp } from "@/hooks/useRsvp";
import { formatEventDate } from "@/lib/utils";
import type { RsvpPublicEventResponse } from "@/api/schema";

const schema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  email: z.string().email("Enter a valid email address"),
  attending: z.boolean(),
  timeSlotId: z.string().nullable(),
  captchaToken: z.string().min(1, "Please complete the CAPTCHA"),
});

type FormValues = z.infer<typeof schema>;

interface RsvpFormProps {
  rsvpToken: string;
  event: RsvpPublicEventResponse;
}

export function RsvpForm({ rsvpToken, event }: RsvpFormProps): React.ReactElement {
  const { user } = useAuth();
  const submitRsvp = useSubmitRsvp(rsvpToken);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      displayName: user?.displayName ?? "",
      email: user?.email ?? "",
      attending: true,
      timeSlotId: null,
      captchaToken: "",
    },
  });

  const attending = watch("attending");
  const timeSlotId = watch("timeSlotId");
  const hasSlots = event.timeSlots.length > 0;

  const onSubmit = (values: FormValues): void => {
    submitRsvp.mutate(
      {
        ...values,
        timeSlotId: values.attending && hasSlots ? values.timeSlotId : null,
      },
      {
        onSuccess: () => {
          setSubmitted(true);
        },
      },
    );
  };

  if (submitted) {
    const hasLinkedRegistries = event.linkedRegistries.length > 0;

    if (user !== null) {
      return (
        <div className="bg-card space-y-4 rounded-lg p-6 text-center">
          <div>
            <h2 className="text-xl font-semibold">
              {attending ? "You're going!" : "Response recorded"}
            </h2>
            <p className="text-muted-foreground mt-2">
              {attending
                ? `Your RSVP for ${event.eventTitle} is confirmed. See you there!`
                : `Thanks for letting us know you can't make it to ${event.eventTitle}.`}
            </p>
          </div>

          {hasLinkedRegistries && (
            <div className="border-t pt-4">
              <p className="text-foreground text-sm font-medium">
                Check out the wish list{event.linkedRegistries.length > 1 ? "s" : ""}:
              </p>
              <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
                {event.linkedRegistries.map((registry) => (
                  <li key={registry.id}>
                    <a href={`/r/${registry.slug}`} className="text-primary hover:underline">
                      {registry.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="bg-card space-y-4 rounded-lg p-6 text-center">
        <div>
          <h2 className="text-xl font-semibold">Check your email</h2>
          <p className="text-muted-foreground mt-2">
            We've sent a confirmation link to your email. Click it to confirm your RSVP for{" "}
            {event.eventTitle}.
          </p>
        </div>

        {hasLinkedRegistries && (
          <div className="border-t pt-4">
            <p className="text-foreground text-sm font-medium">
              Check out the wish list{event.linkedRegistries.length > 1 ? "s" : ""}:
            </p>
            <ul className="text-muted-foreground mt-3 space-y-2 text-sm">
              {event.linkedRegistries.map((registry) => (
                <li key={registry.id}>
                  <a href={`/r/${registry.slug}`} className="text-primary hover:underline">
                    {registry.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="border-t pt-4">
          <p className="text-muted-foreground mt-4">
            Don't have an account?{" "}
            <a
              href="/register"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Create one here
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        void handleSubmit(onSubmit)();
      }}
    >
      {user === null && (
        <>
          <FormField label="Display name" htmlFor="displayName" error={errors.displayName?.message}>
            <Input id="displayName" type="text" autoComplete="name" {...register("displayName")} />
          </FormField>

          <FormField label="Email" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </FormField>
        </>
      )}

      {user !== null && (
        <>
          <input type="hidden" {...register("displayName")} />
          <input type="hidden" {...register("email")} />
        </>
      )}

      <div className="space-y-2">
        <label className="text-sm font-medium">Will you be attending?</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setValue("attending", true, { shouldValidate: true })}
            className={[
              "flex-1 rounded-lg border px-4 py-3 text-center text-sm transition-colors",
              attending
                ? "border-primary bg-primary/10 font-medium"
                : "border-border hover:border-primary/50",
            ].join(" ")}
          >
            Yes, I'll be there
          </button>
          <button
            type="button"
            onClick={() => setValue("attending", false, { shouldValidate: true })}
            className={[
              "flex-1 rounded-lg border px-4 py-3 text-center text-sm transition-colors",
              !attending
                ? "border-primary bg-primary/10 font-medium"
                : "border-border hover:border-primary/50",
            ].join(" ")}
          >
            No, I can't make it
          </button>
        </div>
      </div>
      <input type="hidden" {...register("attending")} />

      {attending && hasSlots && (
        <div className="space-y-2">
          <label className="text-sm font-medium">Time slot</label>
          <div className="flex flex-col gap-2">
            {event.timeSlots.map((slot) => {
              const full = slot.spotsLeft !== null && slot.spotsLeft <= 0;
              return (
                <button
                  key={slot.id}
                  type="button"
                  disabled={full}
                  onClick={() => setValue("timeSlotId", slot.id, { shouldValidate: true })}
                  className={[
                    "flex items-center justify-between rounded-lg border px-4 py-3 text-sm transition-colors",
                    full
                      ? "border-border text-muted-foreground cursor-not-allowed opacity-50"
                      : timeSlotId === slot.id
                        ? "border-primary bg-primary/10 font-medium"
                        : "border-border hover:border-primary/50",
                  ].join(" ")}
                >
                  <span>{formatEventDate(slot.slotTime, slot.slotOffsetSeconds)}</span>
                  {slot.spotsLeft !== null && (
                    <span className="text-muted-foreground text-xs">
                      {full ? "Full" : `${slot.spotsLeft} spots left`}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex justify-center">
          <Turnstile
            siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY ?? ""}
            onSuccess={(token) => setValue("captchaToken", token, { shouldValidate: true })}
          />
        </div>
        {errors.captchaToken !== undefined && (
          <p className="text-destructive text-center text-sm">{errors.captchaToken.message}</p>
        )}
      </div>

      {submitRsvp.isError && (
        <Alert variant="destructive">
          <AlertDescription>{getApiErrorMessage(submitRsvp.error)}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={submitRsvp.isPending}>
        {submitRsvp.isPending ? "Submitting…" : "Submit RSVP"}
      </Button>
    </form>
  );
}

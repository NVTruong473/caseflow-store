import type { Metadata } from "next";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Container,
  ErrorMessage,
  Input,
  Skeleton,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "UI Preview - CaseFlow Books",
  robots: {
    index: false,
    follow: false,
  },
};

const badges = [
  { label: "Neutral", variant: "neutral" as const },
  { label: "Primary", variant: "primary" as const },
  { label: "Paid", variant: "success" as const },
  { label: "Pending", variant: "warning" as const },
  { label: "Error", variant: "error" as const },
];

export default function UiPreviewPage() {
  return (
    <main className="min-h-screen bg-background py-case-xl text-foreground">
      <Container className="flex flex-col gap-case-xl">
        <header className="flex flex-col gap-case-sm border-b border-border pb-case-lg">
          <Badge variant="primary">D06-T02 preview</Badge>
          <div className="flex max-w-3xl flex-col gap-case-sm">
            <h1 className="text-heading-1 font-semibold">UI primitives</h1>
            <p className="text-body leading-7 text-text-muted">
              Visual QA surface for the shared CaseFlow Books components before
              building the storefront layout.
            </p>
          </div>
        </header>

        <section className="grid min-w-0 gap-case-lg lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="flex min-w-0 flex-col gap-case-lg">
            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>
                  Primary, secondary, destructive, ghost, disabled, loading,
                  and icon-size treatment.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex min-w-0 flex-wrap items-center gap-case-sm">
                <Button>Add to cart</Button>
                <Button variant="secondary">View details</Button>
                <Button variant="destructive">Cancel order</Button>
                <Button variant="ghost">Clear filters</Button>
                <Button disabled>Unavailable</Button>
                <Button isLoading>Saving</Button>
                <Button size="icon" variant="secondary" aria-label="Open cart">
                  C
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Form controls</CardTitle>
                <CardDescription>
                  Inputs always render a visible label and keep helper or error
                  text close to the field.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-case-md md:grid-cols-2">
                <Input
                  label="Customer email"
                  type="email"
                  placeholder="name@example.com"
                  hint="Used for order confirmation."
                />
                <Input
                  label="Shipping phone"
                  placeholder="+84 900 000 000"
                  error="Enter a reachable phone number."
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Loading and error states</CardTitle>
                <CardDescription>
                  Skeleton blocks reserve space while content loads; errors are
                  marked with text and shape, not color alone.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-case-md md:grid-cols-2">
                <div className="flex flex-col gap-case-sm">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
                <div className="flex flex-col gap-case-sm">
                  <ErrorMessage>
                    Product data could not be loaded. Try again.
                  </ErrorMessage>
                  <Skeleton shape="circle" className="h-12 w-12" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>

          <aside className="flex min-w-0 flex-col gap-case-lg">
            <Card variant="muted">
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>
                  Status is conveyed with border, label, and tokenized color.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-case-sm">
                {badges.map((badge) => (
                  <Badge key={badge.label} variant={badge.variant}>
                    {badge.label}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card variant="interactive">
              <CardHeader>
                <CardTitle>Product card shell</CardTitle>
                <CardDescription>
                  Stable square media space and compact product metadata.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-case-sm">
                <div className="aspect-square rounded-md border border-border bg-surface" />
                <div className="flex items-start justify-between gap-case-sm">
                  <div>
                    <p className="font-semibold">MagSafe Clear Case</p>
                    <p className="text-small text-text-muted">Book editions</p>
                  </div>
                  <Badge variant="success">In stock</Badge>
                </div>
                <p className="text-heading-3 font-semibold">329,000 VND</p>
              </CardContent>
              <CardFooter>
                <Button className="w-full">Add to cart</Button>
              </CardFooter>
            </Card>
          </aside>
        </section>
      </Container>
    </main>
  );
}

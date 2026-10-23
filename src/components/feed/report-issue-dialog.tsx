"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  categories,
  categoryLabels,
  neighborhoods,
  type Category,
  type Issue,
  type Neighborhood,
} from "@/data/issues";

type ReportIssueDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultNeighborhood: Neighborhood | "all";
  onSubmit: (issue: Issue) => void;
};

export function ReportIssueDialog({
  open,
  onOpenChange,
  defaultNeighborhood,
  onSubmit,
}: ReportIssueDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Category>("roads");
  const [neighborhoodOverride, setNeighborhoodOverride] =
    useState<Neighborhood | null>(null);
  const [address, setAddress] = useState("");
  const neighborhood =
    neighborhoodOverride ??
    (defaultNeighborhood === "all" ? "Downtown" : defaultNeighborhood);

  function reset() {
    setTitle("");
    setDescription("");
    setCategory("roads");
    setNeighborhoodOverride(null);
    setAddress("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();
    const trimmedAddress = address.trim();

    if (!trimmedTitle || !trimmedDescription || !trimmedAddress) {
      toast.error("Add a title, location, and description before submitting.");
      return;
    }

    onSubmit({
      id: `iss-${Date.now()}`,
      title: trimmedTitle,
      description: trimmedDescription,
      category,
      status: "open",
      neighborhood,
      address: trimmedAddress,
      upvotes: 1,
      commentCount: 0,
      reporter: { name: "Alex Chen", initials: "AC" },
      createdAt: new Date().toISOString(),
    });

    toast.success("Issue reported to the community feed.");
    reset();
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (!next) reset();
      }}
    >
      <DialogContent className="sm:max-w-lg" showCloseButton>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Report an Issue</DialogTitle>
            <DialogDescription>
              Share a local problem so neighbors and city staff can track it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium" htmlFor="issue-title">
              Title
              <Input
                id="issue-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="What needs attention?"
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium">
                Category
                <Select
                  value={category}
                  onValueChange={(value) => {
                    if (value) setCategory(value as Category);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{categoryLabels[category]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {categories.map((item) => (
                      <SelectItem key={item} value={item}>
                        {categoryLabels[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              <label className="grid gap-1.5 text-sm font-medium">
                Neighborhood
                <Select
                  value={neighborhood}
                  onValueChange={(value) => {
                    if (value) setNeighborhoodOverride(value as Neighborhood);
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue>{neighborhood}</SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {neighborhoods.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>

            <label className="grid gap-1.5 text-sm font-medium" htmlFor="issue-address">
              Nearby landmark
              <Input
                id="issue-address"
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                placeholder="Street, park, or intersection"
              />
            </label>

            <label className="grid gap-1.5 text-sm font-medium" htmlFor="issue-description">
              Description
              <Textarea
                id="issue-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="What did you see, and why does it matter?"
              />
            </label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Submit report</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

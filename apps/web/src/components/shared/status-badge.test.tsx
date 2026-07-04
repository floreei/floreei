import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { EventStatusBadge, QuoteStatusBadge } from "./status-badge";

describe("status badges", () => {
  it("traduz o status do orçamento", () => {
    render(<QuoteStatusBadge status="APPROVED" />);
    expect(screen.getByText("Aprovado")).toBeInTheDocument();
  });

  it("traduz o status do evento", () => {
    render(<EventStatusBadge status="IN_PROGRESS" />);
    expect(screen.getByText("Em preparo")).toBeInTheDocument();
  });
});

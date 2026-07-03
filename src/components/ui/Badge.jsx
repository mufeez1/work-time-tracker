/** Generic pill/badge. */
export default function Badge({ variant = "unpaid", children }) {
  return <span className={`badge ${variant}`}>{children}</span>;
}

/** Paid / Unpaid badge with standard label. */
export function PaymentBadge({ paid }) {
  return (
    <Badge variant={paid ? "paid" : "unpaid"}>
      {paid ? "✓ Paid" : "Unpaid"}
    </Badge>
  );
}

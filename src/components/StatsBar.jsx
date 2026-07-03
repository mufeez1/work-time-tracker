import { fmtHours, monthLabel } from "../utils/time";
import { PaymentBadge } from "./ui/Badge";

/** Monthly totals footer. */
export default function StatsBar({ stats, month, isPaid, paidAt }) {
  return (
    <div className="totalbar">
      <div className="stat">
        <div className="k">Days worked</div>
        <div className="v">{stats.days}</div>
      </div>
      <div className="stat">
        <div className="k">Total hours ({monthLabel(month)})</div>
        <div className="v">{fmtHours(stats.total)}</div>
      </div>
      <div className="stat">
        <div className="k">Avg hours / day</div>
        <div className="v">{fmtHours(stats.avg)}</div>
      </div>
      <div className="stat">
        <div className="k">Payment</div>
        <div className="v">
          <PaymentBadge paid={isPaid} />
        </div>
        {isPaid && paidAt && (
          <div className="k" style={{ marginTop: 4 }}>
            on {paidAt.slice(0, 10)}
          </div>
        )}
      </div>
    </div>
  );
}

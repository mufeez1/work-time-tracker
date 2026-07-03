import { pad, to12 } from "../utils/time";
import Card from "./ui/Card";

/** Live clock + clock in/off controls. */
export default function ClockCard({ now, openEntry, onClockIn, onClockOff }) {
  return (
    <Card>
      <div className="clock">
        <div className="now">
          <div className="time">
            {pad(now.getHours())}:{pad(now.getMinutes())}:{pad(now.getSeconds())}
          </div>
          <div className="date">
            {now.toLocaleDateString(undefined, {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </div>
        <div className="status">
          {openEntry ? (
            <>
              Clocked in at <b>{to12(openEntry.start_time)}</b> on{" "}
              {openEntry.work_date}
            </>
          ) : (
            "Not clocked in."
          )}
        </div>
        <div className="btns">
          <button className="in" onClick={onClockIn} disabled={!!openEntry}>
            Clock In
          </button>
          <button className="out" onClick={onClockOff} disabled={!openEntry}>
            Clock Off
          </button>
        </div>
      </div>
    </Card>
  );
}

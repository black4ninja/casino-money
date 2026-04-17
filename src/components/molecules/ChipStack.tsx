import { DENOMINATIONS, type Denomination } from "@/domain/denominations";
import type { WalletChip } from "@/domain/types";
import { Chip } from "../atoms/Chip";

type Props = {
  chips: WalletChip[];
  size?: number;
};

/** Groups wallet chips by denomination and shows counted stacks. */
export function ChipStack({ chips, size = 68 }: Props) {
  const byDenom = new Map<Denomination, number>();
  for (const wc of chips) {
    byDenom.set(wc.chip.denom, (byDenom.get(wc.chip.denom) ?? 0) + 1);
  }
  if (chips.length === 0) {
    return (
      <p className="font-label text-sm text-[--color-cream]/60">
        Sin fichas todavía
      </p>
    );
  }
  return (
    <div className="flex flex-wrap items-end gap-3">
      {DENOMINATIONS.map((d) => {
        const count = byDenom.get(d);
        if (!count) return null;
        return <Chip key={d} denom={d} count={count} size={size} />;
      })}
    </div>
  );
}

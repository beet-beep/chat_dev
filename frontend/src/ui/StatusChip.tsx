import { Chip, alpha } from "@mui/material";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import DoneAllIcon from "@mui/icons-material/DoneAll";

type TicketStatus = "PENDING" | "ANSWERED" | "CLOSED" | string;

const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING: {
    label: "답변 대기",
    color: "#F59E0B",
    icon: <AccessTimeIcon sx={{ fontSize: 14 }} />,
  },
  ANSWERED: {
    label: "답변 완료",
    color: "#22C55E",
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} />,
  },
  CLOSED: {
    label: "종료",
    color: "#6B7280",
    icon: <DoneAllIcon sx={{ fontSize: 14 }} />,
  },
};

export function StatusChip({
  status,
  size = "small",
  labels,
}: {
  status: TicketStatus;
  size?: "small" | "medium";
  /** Override default labels */
  labels?: Partial<Record<TicketStatus, string>>;
}) {
  const config = statusConfig[status] ?? statusConfig.PENDING;
  const label = labels?.[status] ?? config.label;

  return (
    <Chip
      icon={config.icon as React.ReactElement}
      label={label}
      size={size}
      sx={{
        fontWeight: 600,
        fontSize: size === "small" ? "0.75rem" : "0.8125rem",
        height: size === "small" ? 24 : 28,
        bgcolor: alpha(config.color, 0.12),
        color: config.color,
        border: `1px solid ${alpha(config.color, 0.25)}`,
        "& .MuiChip-icon": {
          color: config.color,
          ml: 0.5,
        },
        "& .MuiChip-label": {
          px: 1,
        },
      }}
    />
  );
}

/** Category chip with custom color */
export function CategoryChip({
  label,
  color = "#F97316",
  size = "small",
}: {
  label: string;
  color?: string;
  size?: "small" | "medium";
}) {
  return (
    <Chip
      label={label}
      size={size}
      sx={{
        fontWeight: 600,
        fontSize: size === "small" ? "0.75rem" : "0.8125rem",
        height: size === "small" ? 24 : 28,
        bgcolor: alpha(color, 0.1),
        color: color,
        "& .MuiChip-label": {
          px: 1.25,
        },
      }}
    />
  );
}

/** Number badge chip (Q1, Q2, etc.) */
export function NumberChip({
  number,
  prefix = "Q",
  size = "small",
}: {
  number: number;
  prefix?: string;
  size?: "small" | "medium";
}) {
  return (
    <Chip
      label={`${prefix}${number}`}
      size={size}
      sx={{
        fontWeight: 700,
        fontSize: size === "small" ? "0.75rem" : "0.8125rem",
        height: size === "small" ? 26 : 30,
        minWidth: size === "small" ? 42 : 48,
        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
        color: "primary.dark",
        "& .MuiChip-label": {
          px: 1,
        },
      }}
    />
  );
}

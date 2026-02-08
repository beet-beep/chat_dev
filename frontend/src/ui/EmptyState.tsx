import { Box, Button, Card, CardContent, Typography, alpha } from "@mui/material";
import { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
  onAction,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <Card
      sx={{
        textAlign: "center",
        py: 5,
        px: 3,
        borderRadius: 3,
        border: "1px dashed",
        borderColor: (theme) => alpha(theme.palette.text.secondary, 0.2),
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.5),
      }}
    >
      <CardContent sx={{ p: 0 }}>
        {icon && (
          <Box
            sx={{
              width: 64,
              height: 64,
              borderRadius: 3,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
              display: "grid",
              placeItems: "center",
              mx: "auto",
              mb: 2,
              color: "primary.main",
              "& svg": { fontSize: 32 },
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: "1rem",
            color: "text.primary",
            mb: description ? 0.75 : 0,
          }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            variant="body2"
            sx={{
              color: "text.secondary",
              fontSize: "0.875rem",
              lineHeight: 1.5,
              whiteSpace: "pre-line",
            }}
          >
            {description}
          </Typography>
        )}
        {action && onAction && (
          <Button
            variant="contained"
            onClick={onAction}
            sx={{
              mt: 2.5,
              fontWeight: 700,
              borderRadius: 2,
              px: 3,
              py: 1,
            }}
          >
            {action}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

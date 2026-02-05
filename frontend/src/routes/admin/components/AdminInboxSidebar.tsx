import { Avatar, Box, Button, Divider, InputAdornment, MenuItem, TextField, Typography } from "@mui/material";
import AllInboxOutlinedIcon from "@mui/icons-material/AllInboxOutlined";
import MarkEmailUnreadOutlinedIcon from "@mui/icons-material/MarkEmailUnreadOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import SearchIcon from "@mui/icons-material/Search";

export type InboxSidebarPreset = "all" | "pending" | "answered" | "unassigned" | "closed";

export type InboxSidebarView = { id: string; name: string };

function SidebarItem(props: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  active?: boolean;
  onClick?: () => void;
}) {
  const { icon, label, count, active, onClick } = props;
  return (
    <Button
      onClick={onClick}
      variant="text"
      sx={{
        justifyContent: "space-between",
        fontWeight: 900,
        color: "text.primary",
        textTransform: "none",
        px: 1,
        py: 0.75,
        borderRadius: 1.25,
        bgcolor: active ? "rgba(37,99,235,0.10)" : "transparent",
        "&:hover": { bgcolor: active ? "rgba(37,99,235,0.14)" : "action.hover" },
        border: "1px solid",
        borderColor: active ? "rgba(37,99,235,0.22)" : "divider",
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
        <Box sx={{ color: "text.secondary", display: "grid", placeItems: "center" }}>{icon}</Box>
        <Typography sx={{ fontWeight: 900, fontSize: "0.85rem" }} noWrap>
          {label}
        </Typography>
      </Box>
      {typeof count === "number" ? (
        <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 900, fontSize: 11 }}>
          {count}
        </Typography>
      ) : (
        <span />
      )}
    </Button>
  );
}

export function AdminInboxSidebar(props: {
  me?: any | null;
  agents?: { id: number; name: string; email: string; avatar_url?: string; status_message?: string }[];
  primaryTab: "ALL" | "UNREAD" | "MINE";
  onSelectPrimaryTab: (t: "ALL" | "UNREAD" | "MINE") => void;
  mineCount?: number;
  preset: InboxSidebarPreset;
  counts: { all: number; pending: number; answered: number; unassigned: number; closed: number; unread: number };
  onSelectPreset: (k: InboxSidebarPreset) => void;

  // search
  searchQuery?: string;
  onSearchChange?: (q: string) => void;

  // tag filter
  tagFilter?: string;
  tagCounts?: [string, number][];
  onSelectTag?: (tag: string) => void;
  presetTags?: { id: number; name: string; color: string; is_active: boolean }[];

  // entry filter (유입 경로)
  entryFilter?: string;
  entryCounts?: [string, number][];
  onSelectEntry?: (v: string) => void;

  views: InboxSidebarView[];
  activeViewId: string;
  onSelectView: (id: string) => void;
  viewScope: "PERSONAL" | "TEAM";
  onChangeScope: (s: "PERSONAL" | "TEAM") => void;
  onSaveView: () => void;
  onDeleteView: () => void;
  disableDelete: boolean;
}) {
  const {
    me,
    agents = [],
    primaryTab,
    onSelectPrimaryTab,
    mineCount = 0,
    preset,
    counts,
    onSelectPreset,
    searchQuery = "",
    onSearchChange,
    tagFilter = "ALL",
    tagCounts = [],
    onSelectTag,
    presetTags = [],
    entryFilter = "ALL",
    entryCounts = [],
    onSelectEntry,
    views,
    activeViewId,
    onSelectView,
    viewScope,
    onChangeScope,
    onSaveView,
    onDeleteView,
    disableDelete,
  } = props;

  const getTagColor = (tagName: string) => {
    // Check for parent/child format
    const parts = tagName.split("/");
    const parentName = parts[0];
    
    // Find exact match first
    const exactMatch = presetTags.find((t) => t.name === tagName);
    if (exactMatch?.color) return exactMatch.color;
    
    // Find parent match
    const parentMatch = presetTags.find((t) => t.name === parentName);
    if (parentMatch?.color) return parentMatch.color;
    
    return "";
  };

  return (
    <Box
      sx={{
        bgcolor: "background.paper",
        borderRight: "1px solid",
        borderColor: "divider",
        display: { xs: "none", lg: "flex" },
        flexDirection: "column",
        minWidth: 0,
      }}
    >
      {/* Search at the top */}
      <Box sx={{ p: 1.5, pb: 0.75 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="검색"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: "text.secondary", fontSize: 18 }} />
              </InputAdornment>
            ),
            sx: { borderRadius: 1.5, bgcolor: "rgba(255,255,255,0.04)", fontSize: "0.85rem" }
          }}
        />
      </Box>

      {/* agent profile */}
      <Box sx={{ p: 1.5, pt: 0.75 }}>
        <Box
          sx={{
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 1.25,
            bgcolor: "rgba(255,255,255,0.04)",
            p: 1.25,
            display: "flex",
            alignItems: "center",
            gap: 1.25,
          }}
        >
          <Avatar
            src={me?.profile?.avatar_url || undefined}
            sx={{ width: 34, height: 34, bgcolor: "rgba(37,99,235,0.12)", fontWeight: 900 }}
          >
            {(me?.profile?.display_name || me?.email || "A").slice(0, 1)}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography sx={{ fontWeight: 900, fontSize: "0.9rem" }} noWrap>
              {me?.profile?.display_name || me?.first_name || me?.email || "상담사"}
            </Typography>
            <Typography sx={{ color: "text.secondary", fontSize: "0.75rem", fontWeight: 900 }} noWrap>
              {(me?.profile?.status_message || "").trim() ? me.profile.status_message : me?.email || ""}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* primary filter: 전체 / 안 읽은 / 내 상담 */}
      <Box sx={{ px: 1.5, pb: 1.25, display: "grid", gap: 0.75 }}>
        <SidebarItem
          icon={<AllInboxOutlinedIcon fontSize="small" />}
          label="전체"
          count={counts.all}
          active={primaryTab === "ALL"}
          onClick={() => onSelectPrimaryTab("ALL")}
        />
        <SidebarItem
          icon={<MarkEmailUnreadOutlinedIcon fontSize="small" />}
          label="안 읽은"
          count={counts.unread}
          active={primaryTab === "UNREAD"}
          onClick={() => onSelectPrimaryTab("UNREAD")}
        />
        <SidebarItem
          icon={<PersonOutlineOutlinedIcon fontSize="small" />}
          label="내 상담"
          count={mineCount}
          active={primaryTab === "MINE"}
          onClick={() => onSelectPrimaryTab("MINE")}
        />
      </Box>

      <Divider />

      {/* team agents */}
      <Box sx={{ p: 1.5 }}>
        <Typography sx={{ color: "text.secondary", fontWeight: 900, mb: 1 }} variant="caption">
          팀 상담사
        </Typography>
        <Box sx={{ display: "grid", gap: 0.75 }}>
          {agents.slice(0, 8).map((a) => (
            <Box key={a.id} sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Avatar src={a.avatar_url || undefined} sx={{ width: 26, height: 26, bgcolor: "rgba(255,255,255,0.08)", fontWeight: 900 }}>
                {(a.name || a.email || "A").slice(0, 1)}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography sx={{ fontWeight: 900, fontSize: "0.82rem" }} noWrap>
                  {a.name || a.email}
                </Typography>
                <Typography sx={{ color: "text.secondary", fontSize: "0.72rem", fontWeight: 900 }} noWrap>
                  {(a.status_message || "").trim() ? a.status_message : a.email}
                </Typography>
              </Box>
            </Box>
          ))}
          {agents.length === 0 ? (
            <Typography variant="body2" sx={{ color: "text.secondary" }}>
              상담사 목록이 없어요.
            </Typography>
          ) : null}
        </Box>
      </Box>

      <Divider />

      <Box sx={{ p: 1.5, flex: 1, overflow: "auto" }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
          <Typography sx={{ color: "text.secondary", fontWeight: 700, fontSize: "0.75rem" }}>
            상담 태그
          </Typography>
          <Typography sx={{ color: "rgba(255,255,255,0.3)", fontWeight: 600, fontSize: "0.7rem" }}>
            +
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gap: 0.5 }}>
          {tagCounts.slice(0, 12).map(([name, cnt]) => {
            const color = getTagColor(name);
            const isChild = name.includes("/");
            const displayName = isChild ? name.split("/")[1] : name;
            const parentName = isChild ? name.split("/")[0] : null;
            
            return (
              <Button
                key={name}
                onClick={() => onSelectTag?.(name)}
                variant="text"
                sx={{
                  justifyContent: "space-between",
                  fontWeight: 600,
                  color: "text.primary",
                  textTransform: "none",
                  px: 1,
                  py: 0.5,
                  borderRadius: 1,
                  bgcolor: tagFilter === name ? "rgba(37,99,235,0.08)" : "transparent",
                  "&:hover": { bgcolor: tagFilter === name ? "rgba(37,99,235,0.12)" : "rgba(255,255,255,0.04)" },
                  minHeight: 32,
                  ml: isChild ? 2 : 0,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
                  {isChild ? (
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>#</Typography>
                  ) : (
                    <Typography sx={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem" }}>
                      {tagCounts.some(([n]) => n.startsWith(name + "/")) ? "▼" : "#"}
                    </Typography>
                  )}
                  <Box
                    sx={{
                      bgcolor: color || "rgba(255,255,255,0.1)",
                      color: color ? "#fff" : "rgba(255,255,255,0.7)",
                      px: 1,
                      py: 0.25,
                      borderRadius: 0.75,
                      fontWeight: 600,
                      fontSize: "0.8rem",
                    }}
                  >
                    {displayName}
                  </Box>
                </Box>
                <Typography sx={{ color: "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: "0.75rem" }}>
                  {cnt}
                </Typography>
              </Button>
            );
          })}
        </Box>
      </Box>

      <Box sx={{ flex: 1 }} />
    </Box>
  );
}



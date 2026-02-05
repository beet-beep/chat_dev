import {
  Box,
  Card,
  CardContent,
  Divider,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
} from "@mui/material";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import AccountBalanceWalletOutlinedIcon from "@mui/icons-material/AccountBalanceWalletOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import SupportAgentOutlinedIcon from "@mui/icons-material/SupportAgentOutlined";
import LogoutOutlinedIcon from "@mui/icons-material/LogoutOutlined";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ContentCopyOutlinedIcon from "@mui/icons-material/ContentCopyOutlined";
import { Button } from "@mui/material";
import type { Me } from "../../api/types";
import { GameTopBar } from "../ui/GameTopBar";
import { useNavigate } from "react-router-dom";

export function SettingsPage({
  me,
  onGo,
  onSupport,
  onLogout,
}: {
  me: Me;
  onGo: (path: string) => void;
  onSupport: () => void;
  onLogout: () => void;
}) {
  const p = me.profile || ({} as any);
  const nav = useNavigate();
  const email = me.email || "-";
  const uuid = p.game_uuid || me.username || "-";
  const memberCode = p.member_code || "-";

  return (
    <Box sx={{ pb: 2 }}>
      <GameTopBar title="계정 관리" onBack={() => nav(-1)} />
      <Box sx={{ px: 2.5, pt: 0.5 }}>

      <Card sx={{ mt: 1.25 }}>
        <CardContent sx={{ pb: 0 }}>
          <Typography sx={{ fontWeight: 900, mb: 1, display: "flex", alignItems: "center", gap: 1 }}>
            <SettingsOutlinedIcon fontSize="small" /> 메뉴
          </Typography>
        </CardContent>
        <List dense disablePadding>
          <Divider />
          <Box sx={{ px: 1.5, py: 1.25 }}>
            <Typography sx={{ fontWeight: 900 }}>{email}</Typography>
          </Box>
          <Divider />
          <Row
            icon={<PersonOutlineOutlinedIcon />}
            primary="아바타 및 슬라임 설정"
            secondary="프로필 / 장착 아이템 관리"
            onClick={() => onGo("/profile")}
          />
          <Divider />
          <CopyRow label="UUID" value={uuid} />
          <Divider />
          <Box sx={{ px: 1.5, py: 1.25 }}>
            <Typography sx={{ fontWeight: 900 }}>(인증됨)</Typography>
          </Box>
          <Divider />
          <CopyRow label="회원코드" value={memberCode} />
          <Divider />
          <Row icon={<ReceiptLongOutlinedIcon />} primary="결제 정보" secondary="구매 내역/요약" onClick={() => onGo("/billing")} />
          <Divider />
          <Row icon={<AccountBalanceWalletOutlinedIcon />} primary="지갑" secondary="재화/내역" onClick={() => onGo("/wallet")} />
          <Divider />
          <Row icon={<Inventory2OutlinedIcon />} primary="인벤토리" secondary="보유/장착" onClick={() => onGo("/inventory")} />
        </List>
      </Card>

      <Card sx={{ mt: 2 }}>
        <CardContent sx={{ pb: 0 }}>
          <Typography sx={{ fontWeight: 900, mb: 1 }}>고객센터</Typography>
          <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }}>
            (숨겨진 메뉴) 문제가 있을 때만 이용해 주세요.
          </Typography>
        </CardContent>
        <List dense disablePadding>
          <Divider />
          <Row
            icon={<SupportAgentOutlinedIcon />}
            primary="문의하기"
            secondary="주디 고객센터로 이동"
            subtle
            onClick={onSupport}
          />
        </List>
      </Card>

      <Card sx={{ mt: 2 }}>
        <List dense disablePadding>
          <Row icon={<LogoutOutlinedIcon />} primary="로그아웃" secondary="현재 계정에서 나가기" onClick={onLogout} />
        </List>
      </Card>

      <Box sx={{ mt: 2, display: "grid", placeItems: "center" }}>
        <Button
          variant="text"
          color="inherit"
          sx={{ fontWeight: 900, opacity: 0.8 }}
          onClick={() => {
            // MVP: no backend delete endpoint; just clear session.
            onLogout();
          }}
        >
          회원 탈퇴
        </Button>
      </Box>
      </Box>
    </Box>
  );
}

function Row({
  icon,
  primary,
  secondary,
  onClick,
  subtle,
}: {
  icon: any;
  primary: string;
  secondary?: string;
  onClick: () => void;
  subtle?: boolean;
}) {
  return (
    <ListItemButton onClick={onClick} sx={{ py: 1.1, opacity: subtle ? 0.86 : 1 }}>
      <ListItemIcon sx={{ minWidth: 38 }}>{icon}</ListItemIcon>
      <ListItemText
        primary={<Typography sx={{ fontWeight: 900, fontSize: "0.95rem" }}>{primary}</Typography>}
        secondary={
          secondary ? (
            <Typography sx={{ color: "text.secondary", fontSize: "0.85rem" }} noWrap>
              {secondary}
            </Typography>
          ) : null
        }
      />
      <ChevronRightIcon sx={{ color: "text.secondary" }} />
    </ListItemButton>
  );
}

function CopyRow({ label, value }: { label: string; value: string }) {
  return (
    <ListItemButton
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
        } catch {
          // ignore
        }
      }}
      sx={{ py: 1.1 }}
    >
      <ListItemText
        primary={<Typography sx={{ fontWeight: 900, fontSize: "0.95rem" }}>{`${label} : ${value}`}</Typography>}
      />
      <ListItemIcon sx={{ minWidth: 38, justifyContent: "flex-end" }}>
        <ContentCopyOutlinedIcon sx={{ color: "text.secondary" }} />
      </ListItemIcon>
    </ListItemButton>
  );
}



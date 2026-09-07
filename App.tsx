import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Animated,
  Easing,
  useColorScheme,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Modal,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

const { width: W, height: H } = Dimensions.get('window');

// ----------------------------------------------------
// TYPES & DATA
// ----------------------------------------------------
type PageType = 'login' | 'dashboard' | 'history' | 'report';
type TransactionType = 'income' | 'expense';

type Transaction = {
  id: string;
  title: string;
  amount: number;
  type: TransactionType;
  category: string;
  dateStr: string; // YYYY-MM-DD
  timeStr: string; // HH:mm
};

type ToastData = {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
};

const EXPENSE_CATEGORIES = [
  { label: 'Makan & Minum', icon: '🍔' },
  { label: 'Transportasi', icon: '🚗' },
  { label: 'Belanja', icon: '🛍️' },
  { label: 'Tagihan & Utilitas', icon: '⚡' },
  { label: 'Hiburan', icon: '🎬' },
  { label: 'Lainnya', icon: '📦' },
];

const INCOME_CATEGORIES = [
  { label: 'Gaji Pokok', icon: '💰' },
  { label: 'Bonus / Freelance', icon: '💼' },
  { label: 'Investasi', icon: '📈' },
  { label: 'Hadiah / Cashback', icon: '🎁' },
  { label: 'Lainnya', icon: '✨' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: '1',
    title: 'Gaji Bulanan',
    amount: 15000000,
    type: 'income',
    category: 'Gaji Pokok',
    dateStr: '2026-09-07',
    timeStr: '09:00',
  },
  {
    id: '2',
    title: 'Makan Siang Resto',
    amount: 85000,
    type: 'expense',
    category: 'Makan & Minum',
    dateStr: '2026-09-07',
    timeStr: '12:30',
  },
  {
    id: '3',
    title: 'Bensin & Parkir',
    amount: 120000,
    type: 'expense',
    category: 'Transportasi',
    dateStr: '2026-09-07',
    timeStr: '17:45',
  },
  {
    id: '4',
    title: 'Project Web Desain',
    amount: 4500000,
    type: 'income',
    category: 'Bonus / Freelance',
    dateStr: '2026-09-06',
    timeStr: '14:20',
  },
  {
    id: '5',
    title: 'Belanja Bulanan Supermarket',
    amount: 1250000,
    type: 'expense',
    category: 'Belanja',
    dateStr: '2026-09-05',
    timeStr: '19:10',
  },
  {
    id: '6',
    title: 'Tagihan Listrik & WiFi',
    amount: 850000,
    type: 'expense',
    category: 'Tagihan & Utilitas',
    dateStr: '2026-09-01',
    timeStr: '08:00',
  },
  {
    id: '7',
    title: 'Dividen Saham / Reksadana',
    amount: 750000,
    type: 'income',
    category: 'Investasi',
    dateStr: '2026-08-25',
    timeStr: '10:00',
  },
  {
    id: '8',
    title: 'Tiket Bioskop & Popcorn',
    amount: 160000,
    type: 'expense',
    category: 'Hiburan',
    dateStr: '2026-08-20',
    timeStr: '20:15',
  },
];

function formatRupiah(num: number): string {
  return 'Rp ' + (num || 0).toLocaleString('id-ID');
}

function getTodayString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getTimeString(): string {
  const d = new Date();
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

// ----------------------------------------------------
// UI COMPONENTS (LIQUID GLASS THEME)
// ----------------------------------------------------
function FloatingOrb({
  color,
  size,
  x,
  y,
  delay,
}: {
  color: string;
  size: number;
  x: number;
  y: number;
  delay: number;
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(anim, {
            toValue: 1,
            duration: 4500 + Math.random() * 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 4500 + Math.random() * 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [anim, delay]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-25, 25],
  });
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-15, 15],
  });
  const scale = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.1],
  });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity: 0.45,
        transform: [{ translateY }, { translateX }, { scale }],
      }}
    />
  );
}

function GlassToast({
  toast,
  onDismiss,
  isDark,
}: {
  toast: ToastData;
  onDismiss: () => void;
  isDark: boolean;
}) {
  const anim = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.spring(anim, {
          toValue: 1,
          friction: 7,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(pulse, {
              toValue: 1.12,
              duration: 900,
              useNativeDriver: true,
            }),
            Animated.timing(pulse, {
              toValue: 1,
              duration: 900,
              useNativeDriver: true,
            }),
          ])
        ),
      ]).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [toast.visible, anim, pulse]);

  if (!toast.visible) return null;

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-80, 0],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.8, 1],
  });

  const isSuccess = toast.type === 'success';
  const isError = toast.type === 'error';
  const glowColor = isSuccess ? '#34d399' : isError ? '#f87171' : '#60a5fa';
  const badgeGradient = isSuccess
    ? ['#059669', '#10b981', '#34d399']
    : isError
    ? ['#dc2626', '#ef4444', '#f87171']
    : ['#2563eb', '#3b82f6', '#60a5fa'];

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={onDismiss} style={styles.toastTouch}>
        <BlurView
          intensity={Platform.OS === 'ios' ? 85 : 100}
          tint={isDark ? 'dark' : 'light'}
          style={styles.toastGlass}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.05)', 'rgba(0,0,0,0.5)']
                : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0.3)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            style={[
              styles.toastGlowOrb,
              {
                backgroundColor: glowColor,
                transform: [{ scale: pulse }],
              },
            ]}
          />

          <View style={styles.toastContentRow}>
            <LinearGradient colors={badgeGradient as any} style={styles.toastIconBadge}>
              <Text style={styles.toastIconText}>{isSuccess ? '✓' : isError ? '!' : 'ℹ'}</Text>
            </LinearGradient>
            <View style={styles.toastTextWrapper}>
              <Text style={[styles.toastTitle, { color: isDark ? '#ffffff' : '#0f172a' }]}>
                {toast.title}
              </Text>
              <Text style={[styles.toastMessage, { color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(15,23,42,0.75)' }]}>
                {toast.message}
              </Text>
            </View>
            <View style={[styles.toastCloseBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.06)' }]}>
              <Text style={[styles.toastCloseText, { color: isDark ? '#fff' : '#64748b' }]}>✕</Text>
            </View>
          </View>
          <View style={styles.toastGlossLine} />
        </BlurView>
      </TouchableOpacity>
    </Animated.View>
  );
}

function LiquidButtonLoader({ text = 'Memproses...' }: { text?: string }) {
  const spinVal = useRef(new Animated.Value(0)).current;
  const pulseVal = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const spinLoop = Animated.loop(
      Animated.timing(spinVal, {
        toValue: 1,
        duration: 1100,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseVal, {
          toValue: 1.2,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseVal, {
          toValue: 0.7,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    spinLoop.start();
    pulseLoop.start();
    return () => {
      spinLoop.stop();
      pulseLoop.stop();
    };
  }, [pulseVal, spinVal]);

  const spin = spinVal.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.loaderRow}>
      <Animated.View style={[styles.liquidOrbGlow, { transform: [{ scale: pulseVal }] }]} />
      <Animated.View style={[styles.spinnerRing, { transform: [{ rotate: spin }] }]}>
        <View style={styles.spinnerDot} />
      </Animated.View>
      <Text style={styles.savingText}>{text}</Text>
    </View>
  );
}

// ----------------------------------------------------
// MAIN APP COMPONENT
// ----------------------------------------------------
export default function App() {
  const scheme = useColorScheme();
  const [isDark, setIsDark] = useState(scheme === 'dark');
  const [currentPage, setCurrentPage] = useState<PageType>('login');
  const [userEmail, setUserEmail] = useState('');

  // Transactions State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);

  // Login Form States
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Modal Add Transaction States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [txType, setTxType] = useState<TransactionType>('expense');
  const [txTitle, setTxTitle] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState('');
  const [txDate, setTxDate] = useState(getTodayString());
  const [isSaving, setIsSaving] = useState(false);

  // Filter States for History
  const [historyScope, setHistoryScope] = useState<'day' | 'month'>('day');
  const [historyTypeFilter, setHistoryTypeFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [selectedMonth, setSelectedMonth] = useState('2026-09');
  const [selectedDay, setSelectedDay] = useState(getTodayString());

  // Report Filter State
  const [reportMonth, setReportMonth] = useState('2026-09');

  // Toast
  const [toast, setToast] = useState<ToastData>({
    visible: false,
    type: 'success',
    title: '',
    message: '',
  });
  const toastTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setIsDark(scheme === 'dark');
  }, [scheme]);

  const showToast = (type: 'success' | 'error' | 'info', title: string, message: string) => {
    if (toastTimeout.current) clearTimeout(toastTimeout.current);
    setToast({ visible: true, type, title, message });
    toastTimeout.current = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3800);
  };

  const toggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsDark((prev) => !prev);
  };

  // ----------------------------------------------------
  // LOGIN LOGIC
  // ----------------------------------------------------
  const handleLogin = () => {
    if (isLoggingIn) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (!emailInput.trim() || !passwordInput.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Login Gagal', 'Harap masukkan email dan password.');
      return;
    }

    setIsLoggingIn(true);

    setTimeout(() => {
      setIsLoggingIn(false);
      setUserEmail(emailInput.trim());
      setCurrentPage('dashboard');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('success', 'Selamat Datang!', `Berhasil masuk sebagai ${emailInput.trim()}`);
    }, 1500);
  };

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentPage('login');
    setEmailInput('');
    setPasswordInput('');
    showToast('info', 'Keluar Akun', 'Anda telah berhasil logout.');
  };

  // ----------------------------------------------------
  // TRANSACTION LOGIC
  // ----------------------------------------------------
  const openAddModal = (type: TransactionType = 'expense') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTxType(type);
    setTxTitle('');
    setTxAmount('');
    setTxDate(getTodayString());
    setTxCategory(type === 'expense' ? EXPENSE_CATEGORIES[0].label : INCOME_CATEGORIES[0].label);
    setIsModalOpen(true);
  };

  const handleSaveTransaction = () => {
    const parsedAmount = parseInt(txAmount.replace(/[^0-9]/g, ''), 10);
    if (!txTitle.trim() || isNaN(parsedAmount) || parsedAmount <= 0) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      showToast('error', 'Form Belum Lengkap', 'Judul dan nominal harus diisi dengan benar.');
      return;
    }

    setIsSaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setTimeout(() => {
      const newTx: Transaction = {
        id: Date.now().toString(),
        title: txTitle.trim(),
        amount: parsedAmount,
        type: txType,
        category: txCategory || (txType === 'expense' ? 'Pengeluaran' : 'Pemasukan'),
        dateStr: txDate || getTodayString(),
        timeStr: getTimeString(),
      };

      setTransactions((prev) => [newTx, ...prev]);
      setIsSaving(false);
      setIsModalOpen(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast(
        'success',
        txType === 'income' ? 'Pemasukan Ditambahkan!' : 'Pengeluaran Dicatat!',
        `${newTx.title} (${formatRupiah(newTx.amount)})`
      );
    }, 1000);
  };

  const handleDeleteTransaction = (id: string, name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    showToast('info', 'Dihapus', `Transaksi "${name}" berhasil dihapus.`);
  };

  // ----------------------------------------------------
  // CALCULATIONS & SUMMARY
  // ----------------------------------------------------
  const overallStats = useMemo(() => {
    let inc = 0;
    let exp = 0;
    transactions.forEach((t) => {
      if (t.type === 'income') inc += t.amount;
      else exp += t.amount;
    });
    return {
      balance: inc - exp,
      income: inc,
      expense: exp,
    };
  }, [transactions]);

  // History Filter List
  const filteredHistory = useMemo(() => {
    return transactions.filter((t) => {
      // Filter scope (per day or per month)
      if (historyScope === 'day') {
        if (t.dateStr !== selectedDay) return false;
      } else {
        if (!t.dateStr.startsWith(selectedMonth)) return false;
      }
      // Filter type
      if (historyTypeFilter !== 'all' && t.type !== historyTypeFilter) return false;
      return true;
    });
  }, [transactions, historyScope, selectedDay, selectedMonth, historyTypeFilter]);

  // Report calculations for selected report month
  const reportStats = useMemo(() => {
    const monthTx = transactions.filter((t) => t.dateStr.startsWith(reportMonth));
    let totalInc = 0;
    let totalExp = 0;
    const catMap: Record<string, { amount: number; type: TransactionType }> = {};

    monthTx.forEach((t) => {
      if (t.type === 'income') totalInc += t.amount;
      else totalExp += t.amount;

      if (!catMap[t.category]) {
        catMap[t.category] = { amount: 0, type: t.type };
      }
      catMap[t.category].amount += t.amount;
    });

    const categoryBreakdown = Object.keys(catMap).map((cat) => ({
      category: cat,
      amount: catMap[cat].amount,
      type: catMap[cat].type,
      percent:
        catMap[cat].type === 'expense'
          ? totalExp > 0
            ? Math.round((catMap[cat].amount / totalExp) * 100)
            : 0
          : totalInc > 0
          ? Math.round((catMap[cat].amount / totalInc) * 100)
          : 0,
    }));

    return {
      totalIncome: totalInc,
      totalExpense: totalExp,
      netSavings: totalInc - totalExp,
      count: monthTx.length,
      categoryBreakdown: categoryBreakdown.sort((a, b) => b.amount - a.amount),
    };
  }, [transactions, reportMonth]);

  // Distinct months available
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    set.add('2026-09');
    set.add('2026-08');
    transactions.forEach((t) => {
      set.add(t.dateStr.substring(0, 7));
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // Distinct days available
  const availableDays = useMemo(() => {
    const set = new Set<string>();
    set.add(getTodayString());
    transactions.forEach((t) => {
      set.add(t.dateStr);
    });
    return Array.from(set).sort().reverse();
  }, [transactions]);

  // ----------------------------------------------------
  // THEME COLORS
  // ----------------------------------------------------
  const colors = isDark
    ? {
        bg: ['#080816', '#140c24', '#081226'],
        card: 'rgba(255,255,255,0.07)',
        border: 'rgba(255,255,255,0.12)',
        text: '#ffffff',
        sub: 'rgba(255,255,255,0.6)',
        inputBg: 'rgba(255,255,255,0.06)',
        navBg: 'rgba(15, 12, 30, 0.75)',
        filterActive: '#7c6aff',
        filterInactive: 'rgba(255,255,255,0.06)',
      }
    : {
        bg: ['#f0f5fd', '#fbf0f8', '#eef5ff'],
        card: 'rgba(255,255,255,0.72)',
        border: 'rgba(255,255,255,0.85)',
        text: '#0f172a',
        sub: 'rgba(15,23,42,0.55)',
        inputBg: 'rgba(255,255,255,0.85)',
        navBg: 'rgba(255, 255, 255, 0.75)',
        filterActive: '#7c6aff',
        filterInactive: 'rgba(0,0,0,0.05)',
      };

  const currentCategories = txType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  // ----------------------------------------------------
  // RENDER SECTIONS
  // ----------------------------------------------------

  // 1. LOGIN PAGE
  const renderLoginPage = () => (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.loginContainer}>
        <View style={styles.loginHeader}>
          <Text style={[styles.loginAppBadge, { color: '#7c6aff' }]}>LIQUID CASH FLOW</Text>
          <Text style={[styles.loginTitle, { color: colors.text }]}>Kelola Keuangan Modern</Text>
          <Text style={[styles.loginSub, { color: colors.sub }]}>
            Catat pengeluaran & pemasukan harian dengan kemudahan visual glass.
          </Text>
        </View>

        <BlurView
          intensity={isDark ? 45 : 70}
          tint={isDark ? 'dark' : 'light'}
          style={[styles.glassLoginCard, { borderColor: colors.border }]}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)', 'rgba(0,0,0,0.4)']
                : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.45)']
            }
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.sub }]}>Email Pengguna</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="nama@email.com"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                value={emailInput}
                onChangeText={setEmailInput}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoggingIn}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.sub }]}>Password</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={[styles.input, { color: colors.text, flex: 1 }]}
                placeholder="Masukkan password"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                value={passwordInput}
                onChangeText={setPasswordInput}
                secureTextEntry={!showPassword}
                editable={!isLoggingIn}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={{ fontSize: 18 }}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={styles.loginBtn}
            onPress={handleLogin}
            activeOpacity={0.85}
            disabled={isLoggingIn}
          >
            <LinearGradient
              colors={['#7c6aff', '#b06aff']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loginGradient}
            >
              {isLoggingIn ? (
                <LiquidButtonLoader text="Memverifikasi..." />
              ) : (
                <Text style={styles.loginBtnText}>Masuk ke Dashboard</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Demo hint */}
          <TouchableOpacity
            style={styles.demoFillBtn}
            onPress={() => {
              setEmailInput('demo@keuangan.id');
              setPasswordInput('secret123');
              Haptics.selectionAsync();
            }}
          >
            <Text style={[styles.demoFillText, { color: '#7c6aff' }]}>⚡ Isi otomatis akun Demo</Text>
          </TouchableOpacity>

          <View style={styles.cardTopGloss} />
        </BlurView>
      </View>
    </KeyboardAvoidingView>
  );

  // 2. DASHBOARD PAGE
  const renderDashboardPage = () => {
    const recentTx = transactions.slice(0, 5);
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Balance Card */}
        <BlurView intensity={isDark ? 45 : 75} tint={isDark ? 'dark' : 'light'} style={[styles.balanceCard, { borderColor: colors.border }]}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(124,106,255,0.22)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.35)']
                : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.45)', 'rgba(124,106,255,0.08)']
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceLabel, { color: colors.sub }]}>TOTAL SALDO AKTIF</Text>
            <View style={styles.liveIndicator}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>Realtime</Text>
            </View>
          </View>

          <Text style={[styles.balanceAmount, { color: colors.text }]}>
            {formatRupiah(overallStats.balance)}
          </Text>

          {/* Quick Stats Grid */}
          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.1)' }]}>
              <View style={styles.statIconBadgeGreen}>
                <Text style={styles.statArrow}>↓</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Total Masuk</Text>
                <Text style={styles.statIncomeText}>+{formatRupiah(overallStats.income)}</Text>
              </View>
            </View>

            <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.1)' }]}>
              <View style={styles.statIconBadgeRed}>
                <Text style={styles.statArrow}>↑</Text>
              </View>
              <View>
                <Text style={styles.statLabel}>Total Keluar</Text>
                <Text style={styles.statExpenseText}>-{formatRupiah(overallStats.expense)}</Text>
              </View>
            </View>
          </View>

          {/* Quick Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.quickActionBtn}
              activeOpacity={0.85}
              onPress={() => openAddModal('income')}
            >
              <LinearGradient colors={['#10b981', '#059669']} style={styles.quickActionGradient}>
                <Text style={styles.actionBtnText}>+ Tambah Masuk</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.quickActionBtn}
              activeOpacity={0.85}
              onPress={() => openAddModal('expense')}
            >
              <LinearGradient colors={['#ef4444', '#dc2626']} style={styles.quickActionGradient}>
                <Text style={styles.actionBtnText}>- Catat Keluar</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.cardTopGloss} />
        </BlurView>

        {/* Quick Nav shortcut banner */}
        <View style={styles.shortcutRow}>
          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              setCurrentPage('history');
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>📜</Text>
            <Text style={[styles.shortcutTitle, { color: colors.text }]}>Riwayat</Text>
            <Text style={[styles.shortcutSub, { color: colors.sub }]}>Per hari / bulan</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {
              Haptics.selectionAsync();
              setCurrentPage('report');
            }}
          >
            <Text style={{ fontSize: 24, marginBottom: 4 }}>📊</Text>
            <Text style={[styles.shortcutTitle, { color: colors.text }]}>Laporan</Text>
            <Text style={[styles.shortcutSub, { color: colors.sub }]}>Summary bulanan</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions List */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Aktivitas Terbaru</Text>
          <TouchableOpacity onPress={() => setCurrentPage('history')}>
            <Text style={[styles.seeAllLink, { color: '#7c6aff' }]}>Lihat Semua →</Text>
          </TouchableOpacity>
        </View>

        {recentTx.length === 0 ? (
          <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🍃</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum ada transaksi</Text>
          </BlurView>
        ) : (
          recentTx.map((tx) => {
            const isInc = tx.type === 'income';
            return (
              <BlurView
                key={tx.id}
                intensity={isDark ? 35 : 65}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.txCard, { borderColor: colors.border }]}
              >
                <LinearGradient
                  colors={
                    isDark
                      ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)']
                      : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.4)']
                  }
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.txIconBox, { backgroundColor: isInc ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                  <Text style={{ fontSize: 20 }}>{isInc ? '💰' : '💸'}</Text>
                </View>

                <View style={styles.txInfo}>
                  <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>
                    {tx.title}
                  </Text>
                  <Text style={[styles.txMeta, { color: colors.sub }]}>
                    {tx.category} • {tx.dateStr}
                  </Text>
                </View>

                <View style={styles.txAmountCol}>
                  <Text style={[styles.txAmount, { color: isInc ? '#10b981' : '#f87171' }]}>
                    {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                  </Text>
                  <Text style={[styles.txTime, { color: colors.sub }]}>{tx.timeStr}</Text>
                </View>
                <View style={styles.cardTopGloss} />
              </BlurView>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    );
  };

  // 3. HISTORY PAGE (FILTER PER HARI / PER BULAN)
  const renderHistoryPage = () => {
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Scope Switcher: Per Hari / Per Bulan */}
        <View style={[styles.filterScopeContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.scopeBtn, historyScope === 'day' && { backgroundColor: '#7c6aff' }]}
            onPress={() => {
              Haptics.selectionAsync();
              setHistoryScope('day');
            }}
          >
            <Text style={[styles.scopeBtnText, { color: historyScope === 'day' ? '#fff' : colors.sub }]}>
              📅 Per Hari
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.scopeBtn, historyScope === 'month' && { backgroundColor: '#7c6aff' }]}
            onPress={() => {
              Haptics.selectionAsync();
              setHistoryScope('month');
            }}
          >
            <Text style={[styles.scopeBtnText, { color: historyScope === 'month' ? '#fff' : colors.sub }]}>
              📆 Per Bulan
            </Text>
          </TouchableOpacity>
        </View>

        {/* Date/Month selector pill list */}
        <View style={{ marginBottom: 16 }}>
          <Text style={[styles.filterLabel, { color: colors.sub }]}>
            {historyScope === 'day' ? 'PILIH TANGGAL' : 'PILIH BULAN'}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {historyScope === 'day'
              ? availableDays.map((day) => {
                  const active = selectedDay === day;
                  return (
                    <TouchableOpacity
                      key={day}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedDay(day);
                      }}
                      style={[
                        styles.datePill,
                        {
                          backgroundColor: active ? '#7c6aff' : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.datePillText, { color: active ? '#fff' : colors.text }]}>
                        {day === getTodayString() ? `Hari ini (${day})` : day}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              : availableMonths.map((m) => {
                  const active = selectedMonth === m;
                  return (
                    <TouchableOpacity
                      key={m}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedMonth(m);
                      }}
                      style={[
                        styles.datePill,
                        {
                          backgroundColor: active ? '#7c6aff' : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.datePillText, { color: active ? '#fff' : colors.text }]}>
                        Bulan {m}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
          </ScrollView>
        </View>

        {/* Income / Expense filter bar */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {filteredHistory.length} Transaksi Ditemukan
          </Text>
          <View style={styles.filterPillContainer}>
            {(['all', 'income', 'expense'] as const).map((t) => {
              const active = historyTypeFilter === t;
              return (
                <TouchableOpacity
                  key={t}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setHistoryTypeFilter(t);
                  }}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active ? colors.filterActive : colors.filterInactive,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      { color: active ? '#ffffff' : colors.sub, fontWeight: active ? '700' : '500' },
                    ]}
                  >
                    {t === 'all' ? 'Semua' : t === 'income' ? 'Masuk' : 'Keluar'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* List Content */}
        {filteredHistory.length === 0 ? (
          <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Text style={{ fontSize: 36, marginBottom: 8 }}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Tidak ada transaksi</Text>
            <Text style={[styles.emptySubtitle, { color: colors.sub }]}>
              Tidak ditemukan data transaksi pada periode dan filter yang dipilih.
            </Text>
          </BlurView>
        ) : (
          filteredHistory.map((tx) => {
            const isInc = tx.type === 'income';
            return (
              <BlurView
                key={tx.id}
                intensity={isDark ? 35 : 65}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.txCard, { borderColor: colors.border }]}
              >
                <LinearGradient
                  colors={
                    isDark
                      ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)']
                      : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.4)']
                  }
                  style={StyleSheet.absoluteFill}
                />
                <View style={[styles.txIconBox, { backgroundColor: isInc ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)' }]}>
                  <Text style={{ fontSize: 20 }}>{isInc ? '💰' : '💸'}</Text>
                </View>

                <View style={styles.txInfo}>
                  <Text style={[styles.txTitle, { color: colors.text }]} numberOfLines={1}>
                    {tx.title}
                  </Text>
                  <Text style={[styles.txMeta, { color: colors.sub }]}>
                    {tx.category} • {tx.dateStr} ({tx.timeStr})
                  </Text>
                </View>

                <View style={styles.txAmountCol}>
                  <Text style={[styles.txAmount, { color: isInc ? '#10b981' : '#f87171' }]}>
                    {isInc ? '+' : '-'} {formatRupiah(tx.amount)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteTransaction(tx.id, tx.title)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Text style={styles.txDeleteBtn}>Hapus</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.cardTopGloss} />
              </BlurView>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    );
  };

  // 4. REPORT / SUMMARY PAGE
  const renderReportPage = () => {
    return (
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Month Picker */}
        <View style={{ marginBottom: 18 }}>
          <Text style={[styles.filterLabel, { color: colors.sub }]}>PILIH BULAN LAPORAN</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 6 }}>
            {availableMonths.map((m) => {
              const active = reportMonth === m;
              return (
                <TouchableOpacity
                  key={m}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setReportMonth(m);
                  }}
                  style={[
                    styles.datePill,
                    {
                      backgroundColor: active ? '#7c6aff' : colors.inputBg,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.datePillText, { color: active ? '#fff' : colors.text }]}>
                    Bulan {m}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Report Overview Glass Card */}
        <BlurView intensity={isDark ? 45 : 75} tint={isDark ? 'dark' : 'light'} style={[styles.balanceCard, { borderColor: colors.border }]}>
          <LinearGradient
            colors={
              isDark
                ? ['rgba(124,106,255,0.18)', 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.3)']
                : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0.5)', 'rgba(124,106,255,0.06)']
            }
            style={StyleSheet.absoluteFill}
          />

          <View style={styles.balanceHeader}>
            <Text style={[styles.balanceLabel, { color: colors.sub }]}>SURPLUS / DEFISIT BULANAN</Text>
            <Text style={[styles.reportBadge, { color: '#7c6aff' }]}>{reportMonth}</Text>
          </View>

          <Text style={[styles.balanceAmount, { color: reportStats.netSavings >= 0 ? '#10b981' : '#ef4444' }]}>
            {reportStats.netSavings >= 0 ? '+' : ''}
            {formatRupiah(reportStats.netSavings)}
          </Text>

          <View style={styles.statsRow}>
            <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.1)' }]}>
              <View>
                <Text style={styles.statLabel}>Total Pemasukan</Text>
                <Text style={styles.statIncomeText}>+{formatRupiah(reportStats.totalIncome)}</Text>
              </View>
            </View>

            <View style={[styles.statBox, { backgroundColor: isDark ? 'rgba(239,68,68,0.12)' : 'rgba(239,68,68,0.1)' }]}>
              <View>
                <Text style={styles.statLabel}>Total Pengeluaran</Text>
                <Text style={styles.statExpenseText}>-{formatRupiah(reportStats.totalExpense)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.cardTopGloss} />
        </BlurView>

        {/* Category Breakdown section */}
        <Text style={[styles.sectionTitle, { color: colors.text, marginBottom: 12 }]}>
          Rincian Berdasarkan Kategori
        </Text>

        {reportStats.categoryBreakdown.length === 0 ? (
          <BlurView intensity={isDark ? 30 : 50} tint={isDark ? 'dark' : 'light'} style={[styles.emptyCard, { borderColor: colors.border }]}>
            <Text style={{ fontSize: 32, marginBottom: 6 }}>📊</Text>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Belum ada data bulan ini</Text>
          </BlurView>
        ) : (
          reportStats.categoryBreakdown.map((item, idx) => {
            const isInc = item.type === 'income';
            return (
              <BlurView
                key={idx}
                intensity={isDark ? 35 : 65}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.categoryBreakdownCard, { borderColor: colors.border }]}
              >
                <LinearGradient
                  colors={
                    isDark
                      ? ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.01)']
                      : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.4)']
                  }
                  style={StyleSheet.absoluteFill}
                />

                <View style={styles.catBreakdownHeader}>
                  <Text style={[styles.catBreakdownTitle, { color: colors.text }]}>
                    {item.category} ({isInc ? 'Masuk' : 'Keluar'})
                  </Text>
                  <Text style={[styles.catBreakdownAmount, { color: isInc ? '#10b981' : '#f87171' }]}>
                    {formatRupiah(item.amount)} ({item.percent}%)
                  </Text>
                </View>

                {/* Visual Progress Bar */}
                <View style={[styles.progressBarBg, { backgroundColor: colors.inputBg }]}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(item.percent, 100)}%`,
                        backgroundColor: isInc ? '#10b981' : '#ef4444',
                      },
                    ]}
                  />
                </View>

                <View style={styles.cardTopGloss} />
              </BlurView>
            );
          })
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.bg[0] }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={colors.bg as any}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Floating Ambient Orbs */}
      <FloatingOrb color={isDark ? 'rgba(124,106,255,0.35)' : 'rgba(124,106,255,0.22)'} size={300} x={-70} y={40} delay={0} />
      <FloatingOrb color={isDark ? 'rgba(236,72,153,0.3)' : 'rgba(244,114,182,0.2)'} size={250} x={W - 140} y={180} delay={600} />
      <FloatingOrb color={isDark ? 'rgba(56,189,248,0.25)' : 'rgba(56,189,248,0.2)'} size={220} x={40} y={H - 260} delay={1200} />

      {/* Glass Notification Toast */}
      <GlassToast toast={toast} isDark={isDark} onDismiss={() => setToast((p) => ({ ...p, visible: false }))} />

      {/* Top Navigation Bar (Shown on dashboard, history, report) */}
      {currentPage !== 'login' && (
        <View style={styles.topBar}>
          <View>
            <Text style={[styles.appSubtitle, { color: colors.sub }]}>
              {userEmail ? `Halo, ${userEmail.split('@')[0]}` : 'Dompet Pintar'}
            </Text>
            <Text style={[styles.appTitle, { color: colors.text }]}>
              {currentPage === 'dashboard'
                ? 'Dashboard'
                : currentPage === 'history'
                ? 'Riwayat Transaksi'
                : 'Laporan Bulanan'}
            </Text>
          </View>
          <View style={styles.topBarRight}>
            <TouchableOpacity style={[styles.themeBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={toggleTheme}>
              <Text style={{ fontSize: 17 }}>{isDark ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.logoutBtn, { backgroundColor: colors.inputBg, borderColor: colors.border }]} onPress={handleLogout}>
              <Text style={{ fontSize: 15 }}>🚪</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Content Area */}
      {currentPage === 'login' && renderLoginPage()}
      {currentPage === 'dashboard' && renderDashboardPage()}
      {currentPage === 'history' && renderHistoryPage()}
      {currentPage === 'report' && renderReportPage()}

      {/* Bottom Liquid Glass Navigation Bar (When authenticated) */}
      {currentPage !== 'login' && (
        <View style={styles.bottomNavContainer}>
          <BlurView intensity={isDark ? 65 : 85} tint={isDark ? 'dark' : 'light'} style={[styles.bottomGlassNav, { borderColor: colors.border }]}>
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255,255,255,0.1)', 'rgba(0,0,0,0.4)']
                  : ['rgba(255,255,255,0.85)', 'rgba(255,255,255,0.4)']
              }
              style={StyleSheet.absoluteFill}
            />

            <TouchableOpacity
              style={styles.navTab}
              onPress={() => {
                Haptics.selectionAsync();
                setCurrentPage('dashboard');
              }}
            >
              <Text style={{ fontSize: 20 }}>🏠</Text>
              <Text style={[styles.navTabText, { color: currentPage === 'dashboard' ? '#7c6aff' : colors.sub, fontWeight: currentPage === 'dashboard' ? '800' : '500' }]}>
                Home
              </Text>
            </TouchableOpacity>

            {/* Quick Add Floating Center Button */}
            <TouchableOpacity
              style={styles.centerAddBtn}
              onPress={() => openAddModal('expense')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#7c6aff', '#b06aff']} style={styles.centerAddGradient}>
                <Text style={styles.centerAddText}>+</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navTab}
              onPress={() => {
                Haptics.selectionAsync();
                setCurrentPage('history');
              }}
            >
              <Text style={{ fontSize: 20 }}>📜</Text>
              <Text style={[styles.navTabText, { color: currentPage === 'history' ? '#7c6aff' : colors.sub, fontWeight: currentPage === 'history' ? '800' : '500' }]}>
                Riwayat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navTab}
              onPress={() => {
                Haptics.selectionAsync();
                setCurrentPage('report');
              }}
            >
              <Text style={{ fontSize: 20 }}>📊</Text>
              <Text style={[styles.navTabText, { color: currentPage === 'report' ? '#7c6aff' : colors.sub, fontWeight: currentPage === 'report' ? '800' : '500' }]}>
                Laporan
              </Text>
            </TouchableOpacity>

            <View style={styles.cardTopGloss} />
          </BlurView>
        </View>
      )}

      {/* MODAL INPUT TRANSAKSI (LIQUID GLASS) */}
      <Modal visible={isModalOpen} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => !isSaving && setIsModalOpen(false)}
          />

          <BlurView
            intensity={isDark ? 70 : 90}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.modalGlassCard, { borderColor: colors.border }]}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.03)', 'rgba(0,0,0,0.6)']
                  : ['rgba(255,255,255,0.95)', 'rgba(255,255,255,0.6)']
              }
              style={StyleSheet.absoluteFill}
            />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {txType === 'income' ? 'Catat Pemasukan' : 'Catat Pengeluaran'}
              </Text>
              <TouchableOpacity
                onPress={() => !isSaving && setIsModalOpen(false)}
                style={[styles.modalCloseBtn, { backgroundColor: colors.inputBg }]}
              >
                <Text style={{ color: colors.text, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Type Switcher */}
            <View style={[styles.modalTypeSwitch, { backgroundColor: colors.inputBg }]}>
              <TouchableOpacity
                style={[styles.typeBtn, txType === 'expense' && { backgroundColor: '#ef4444' }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTxType('expense');
                  setTxCategory(EXPENSE_CATEGORIES[0].label);
                }}
              >
                <Text style={[styles.typeBtnText, { color: txType === 'expense' ? '#fff' : colors.sub }]}>
                  Pengeluaran
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.typeBtn, txType === 'income' && { backgroundColor: '#10b981' }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  setTxType('income');
                  setTxCategory(INCOME_CATEGORIES[0].label);
                }}
              >
                <Text style={[styles.typeBtnText, { color: txType === 'income' ? '#fff' : colors.sub }]}>
                  Pemasukan
                </Text>
              </TouchableOpacity>
            </View>

            {/* Title Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.sub }]}>Deskripsi / Judul</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                placeholder="misal: Makan Siang, Gaji, Belanja..."
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                value={txTitle}
                onChangeText={setTxTitle}
                editable={!isSaving}
              />
            </View>

            {/* Amount Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.sub }]}>Nominal (Rp)</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                placeholder="Contoh: 50000"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                value={txAmount}
                onChangeText={(val) => setTxAmount(val.replace(/[^0-9]/g, ''))}
                keyboardType="numeric"
                editable={!isSaving}
              />
            </View>

            {/* Date Input */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.sub }]}>Tanggal Transaksi (YYYY-MM-DD)</Text>
              <TextInput
                style={[styles.formInput, { color: colors.text, backgroundColor: colors.inputBg, borderColor: colors.border }]}
                placeholder="2026-09-07"
                placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)'}
                value={txDate}
                onChangeText={setTxDate}
                editable={!isSaving}
              />
            </View>

            {/* Category selection */}
            <View style={styles.formGroup}>
              <Text style={[styles.formLabel, { color: colors.sub }]}>Pilih Kategori</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                {currentCategories.map((c) => {
                  const active = txCategory === c.label;
                  return (
                    <TouchableOpacity
                      key={c.label}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setTxCategory(c.label);
                      }}
                      style={[
                        styles.catPill,
                        {
                          backgroundColor: active
                            ? txType === 'income'
                              ? '#10b981'
                              : '#ef4444'
                            : colors.inputBg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={{ marginRight: 6 }}>{c.icon}</Text>
                      <Text style={{ color: active ? '#fff' : colors.text, fontWeight: active ? '700' : '500', fontSize: 13 }}>
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Submit Button with Liquid Loader */}
            <TouchableOpacity
              style={[styles.submitBtn, isSaving && { opacity: 0.85 }]}
              onPress={handleSaveTransaction}
              disabled={isSaving}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={txType === 'income' ? ['#10b981', '#059669'] : ['#7c6aff', '#9333ea']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isSaving ? (
                  <LiquidButtonLoader text="Menyimpan Transaksi..." />
                ) : (
                  <Text style={styles.submitBtnText}>Simpan Transaksi</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.cardTopGloss} />
          </BlurView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

// ----------------------------------------------------
// STYLES
// ----------------------------------------------------
const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 6, paddingBottom: 40 },

  /* Top Bar */
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 8,
  },
  topBarRight: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  appSubtitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6 },
  appTitle: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Login Page Styles */
  loginContainer: { flex: 1, justifyContent: 'center', paddingHorizontal: 20 },
  loginHeader: { marginBottom: 24, alignItems: 'center' },
  loginAppBadge: { fontSize: 13, fontWeight: '800', letterSpacing: 1.5, marginBottom: 6 },
  loginTitle: { fontSize: 30, fontWeight: '900', textAlign: 'center', letterSpacing: -0.5, marginBottom: 8 },
  loginSub: { fontSize: 14, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },
  glassLoginCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 24,
    overflow: 'hidden',
  },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1.2,
    paddingHorizontal: 16,
    height: 54,
  },
  inputIcon: { fontSize: 18, marginRight: 10 },
  input: { fontSize: 15, flex: 1 },
  loginBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: 12 },
  loginGradient: { paddingVertical: 16, alignItems: 'center', borderRadius: 16 },
  loginBtnText: { color: '#ffffff', fontSize: 16, fontWeight: '800', letterSpacing: 0.3 },
  demoFillBtn: { alignSelf: 'center', paddingVertical: 6 },
  demoFillText: { fontSize: 13, fontWeight: '700' },

  /* Balance Card */
  balanceCard: {
    borderRadius: 28,
    borderWidth: 1.5,
    padding: 22,
    overflow: 'hidden',
    marginTop: 6,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  balanceLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  reportBadge: { fontSize: 13, fontWeight: '800' },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(52,211,153,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 5,
  },
  liveText: { fontSize: 10, fontWeight: '700', color: '#10b981' },
  balanceAmount: { fontSize: 32, fontWeight: '900', letterSpacing: -1, marginBottom: 18 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 18 },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 18,
  },
  statIconBadgeGreen: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statIconBadgeRed: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  statArrow: { color: '#fff', fontWeight: '900', fontSize: 14 },
  statLabel: { fontSize: 11, fontWeight: '600', color: 'rgba(150,150,150,0.85)', marginBottom: 2 },
  statIncomeText: { fontSize: 13, fontWeight: '800', color: '#10b981' },
  statExpenseText: { fontSize: 13, fontWeight: '800', color: '#ef4444' },

  actionButtonsRow: { flexDirection: 'row', gap: 12 },
  quickActionBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  quickActionGradient: { paddingVertical: 14, alignItems: 'center', borderRadius: 16 },
  actionBtnText: { color: '#ffffff', fontSize: 13, fontWeight: '800', letterSpacing: 0.2 },

  /* Shortcuts */
  shortcutRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  shortcutCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 16,
  },
  shortcutTitle: { fontSize: 15, fontWeight: '800', marginBottom: 2 },
  shortcutSub: { fontSize: 12, fontWeight: '500' },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  seeAllLink: { fontSize: 13, fontWeight: '700' },

  /* Filter scope & pills */
  filterScopeContainer: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1.2,
    padding: 4,
    marginBottom: 16,
  },
  scopeBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 12 },
  scopeBtnText: { fontSize: 13, fontWeight: '700' },
  filterLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8 },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  datePillText: { fontSize: 12, fontWeight: '700' },
  filterPillContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: 14,
    padding: 3,
  },
  filterPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 11 },
  filterPillText: { fontSize: 11 },

  /* Transaction Card */
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  txIconBox: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txInfo: { flex: 1, paddingRight: 8 },
  txTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  txMeta: { fontSize: 11, fontWeight: '500' },
  txAmountCol: { alignItems: 'flex-end' },
  txAmount: { fontSize: 14, fontWeight: '800', marginBottom: 2 },
  txTime: { fontSize: 11 },
  txDeleteBtn: { fontSize: 11, color: '#f87171', fontWeight: '700' },

  emptyCard: {
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: '700', marginBottom: 4 },
  emptySubtitle: { fontSize: 12, textAlign: 'center', paddingHorizontal: 16 },

  /* Report Category Card */
  categoryBreakdownCard: {
    borderRadius: 18,
    borderWidth: 1.2,
    padding: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  catBreakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  catBreakdownTitle: { fontSize: 14, fontWeight: '700' },
  catBreakdownAmount: { fontSize: 13, fontWeight: '800' },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: 6, borderRadius: 3 },

  /* Bottom Glass Navigation */
  bottomNavContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 24 : 14,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  bottomGlassNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 26,
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  navTab: { alignItems: 'center', justifyContent: 'center', width: 64 },
  navTabText: { fontSize: 10, marginTop: 3 },
  centerAddBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: -8,
    shadowColor: '#7c6aff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  centerAddGradient: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  centerAddText: { color: '#fff', fontSize: 28, fontWeight: '400', marginTop: -2 },

  cardTopGloss: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },

  /* Modal Styles */
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalGlassCard: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1.5,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    padding: 22,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 19, fontWeight: '800' },
  modalCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTypeSwitch: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
  },
  typeBtn: { flex: 1, paddingVertical: 9, alignItems: 'center', borderRadius: 11 },
  typeBtnText: { fontSize: 13, fontWeight: '700' },

  formGroup: { marginBottom: 14 },
  formLabel: { fontSize: 11, fontWeight: '700', marginBottom: 5, textTransform: 'uppercase' },
  formInput: {
    borderRadius: 14,
    borderWidth: 1.2,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
  },
  catScroll: { marginTop: 4 },
  catPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },

  submitBtn: { borderRadius: 16, overflow: 'hidden', marginTop: 8, marginBottom: Platform.OS === 'ios' ? 14 : 6 },
  submitGradient: { paddingVertical: 15, alignItems: 'center', borderRadius: 16 },
  submitBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '800', letterSpacing: 0.3 },
  savingText: { color: '#ffffff', fontSize: 14, fontWeight: '600', marginLeft: 10 },

  /* Loader & Toast Styles */
  loaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  liquidOrbGlow: {
    position: 'absolute',
    left: -4,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  spinnerRing: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2.2,
    borderColor: 'rgba(255,255,255,0.25)',
    borderTopColor: '#ffffff',
    borderRightColor: '#ffffff',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  spinnerDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#ffffff', marginTop: -1.5 },

  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 56 : 36,
    left: 20,
    right: 20,
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  toastTouch: { borderRadius: 22, overflow: 'hidden' },
  toastGlass: {
    borderRadius: 22,
    borderWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.35)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    overflow: 'hidden',
  },
  toastGlowOrb: {
    position: 'absolute',
    left: 10,
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    opacity: 0.35,
  },
  toastContentRow: { flexDirection: 'row', alignItems: 'center' },
  toastIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  toastIconText: { color: '#ffffff', fontSize: 14, fontWeight: '900' },
  toastTextWrapper: { flex: 1, paddingRight: 8 },
  toastTitle: { fontSize: 14, fontWeight: '700', marginBottom: 2 },
  toastMessage: { fontSize: 12, fontWeight: '500' },
  toastCloseBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toastCloseText: { fontSize: 10, fontWeight: '700' },
  toastGlossLine: {
    position: 'absolute',
    top: 0,
    left: 20,
    right: 20,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});

import { DOCUMENT, Injectable, computed, effect, inject, signal } from '@angular/core';

export type Lang = 'fr' | 'ar';

const fr = {
  appName: 'SmartClient',
  tagline: 'Gestion des clients, des accès et des paramètres, au même endroit.',
  // login
  loginTitle: 'Connexion',
  loginSubtitle: 'Accédez à votre espace de gestion.',
  username: "Nom d'utilisateur",
  password: 'Mot de passe',
  signIn: 'Se connecter',
  signingIn: 'Connexion…',
  badCredentials: "Nom d'utilisateur ou mot de passe incorrect.",
  serverUnreachable: 'Le serveur ne répond pas. Réessayez dans un instant.',
  serverChecking: 'Vérification du serveur…',
  serverWaking: 'Démarrage du serveur (offre gratuite) : jusqu’à 1 minute.',
  serverReady: 'Serveur prêt',
  oldVersion: 'Ancienne version',
  demoAccount: 'Compte de démo',
  useDemo: 'Remplir',
  heroPoint1: 'Utilisateurs, rôles et droits d’accès',
  heroPoint2: 'Menus dynamiques selon le rôle',
  heroPoint3: 'Pays et villes en français et en arabe',
  required: 'Champ obligatoire',
  // shell
  navigation: 'Navigation',
  dashboard: 'Tableau de bord',
  administration: 'Administration',
  settings: 'Paramètres',
  users: 'Utilisateurs',
  roles: 'Rôles',
  menus: 'Menus',
  countries: 'Pays',
  cities: 'Villes',
  logout: 'Se déconnecter',
  darkMode: 'Mode sombre',
  lightMode: 'Mode clair',
  language: 'العربية',
  openMenu: 'Ouvrir le menu',
  closeMenu: 'Fermer le menu',
  sessionExpired: 'Session expirée, veuillez vous reconnecter.',
  // dashboard
  hello: 'Bonjour',
  dashboardIntro: 'Voici l’état de votre application aujourd’hui.',
  citiesByCountry: 'Villes par pays',
  usersByRole: 'Utilisateurs par rôle',
  latestUsers: 'Derniers utilisateurs',
  seeAll: 'Tout voir',
  quickActions: 'Actions rapides',
  manageUsers: 'Gérer les comptes et leurs rôles',
  manageRoles: 'Définir les droits d’accès',
  manageMenus: 'Organiser la navigation',
  manageSettings: 'Pays et villes',
  // common
  search: 'Rechercher…',
  add: 'Ajouter',
  edit: 'Modifier',
  delete: 'Supprimer',
  cancel: 'Annuler',
  save: 'Enregistrer',
  saving: 'Enregistrement…',
  actions: 'Actions',
  noResults: 'Aucun résultat.',
  loading: 'Chargement…',
  loadError: 'Impossible de charger les données.',
  retry: 'Réessayer',
  saved: 'Enregistré',
  deleted: 'Supprimé',
  saveError: 'Échec de l’enregistrement.',
  deleteError: 'Suppression impossible.',
  confirmDelete: 'Confirmer la suppression',
  confirmDeleteText: 'Cette action est définitive. Supprimer « {name} » ?',
  titleFr: 'Libellé (français)',
  titleAr: 'Libellé (arabe)',
  total: 'au total',
  // users
  usersSubtitle: 'Comptes ayant accès à l’application.',
  newUser: 'Nouvel utilisateur',
  editUser: 'Modifier l’utilisateur',
  firstName: 'Prénom',
  lastName: 'Nom',
  login: 'Identifiant',
  email: 'E-mail',
  phone: 'Téléphone',
  role: 'Rôle',
  state: 'État',
  createdAt: 'Inscrit le',
  chooseRole: 'Choisir un rôle',
  confirmPassword: 'Confirmer le mot de passe',
  passwordsDiffer: 'Les mots de passe ne correspondent pas.',
  invalidEmail: 'Adresse e-mail invalide',
  superAdminOnly: 'Seul un super administrateur peut modifier ce compte.',
  allRoles: 'Tous les rôles',
  active: 'Actif',
  inactive: 'Inactif',
  // roles
  rolesSubtitle: 'Chaque rôle donne accès à une liste de menus.',
  newRole: 'Nouveau rôle',
  editRole: 'Modifier le rôle',
  code: 'Code',
  title: 'Intitulé',
  accessibleMenus: 'Menus accessibles',
  usersCount: 'utilisateur(s)',
  menusCount: 'menu(s)',
  selectAll: 'Tout cocher',
  roleInUse: 'Ce rôle est attribué à des utilisateurs.',
  // menus
  menusSubtitle: 'La barre latérale est construite à partir de ces menus, selon le rôle.',
  newMenu: 'Nouveau menu',
  editMenu: 'Modifier le menu',
  url: 'Adresse (URL)',
  icon: 'Icône',
  order: 'Ordre',
  parent: 'Menu parent',
  noParent: 'Aucun (menu principal)',
  submenus: 'sous-menu(s)',
  // countries & cities
  countriesSubtitle: 'Liste des pays, en français et en arabe.',
  newCountry: 'Nouveau pays',
  editCountry: 'Modifier le pays',
  citiesSubtitle: 'Liste des villes rattachées à un pays.',
  newCity: 'Nouvelle ville',
  editCity: 'Modifier la ville',
  country: 'Pays',
  allCountries: 'Tous les pays',
  chooseCountry: 'Choisir un pays',
  footer: 'Refonte Angular 22 + Tailwind CSS par OA',
};

type Dict = Record<keyof typeof fr, string>;

const ar: Dict = {
  appName: 'SmartClient',
  tagline: 'إدارة العملاء والصلاحيات والإعدادات في مكان واحد.',
  loginTitle: 'تسجيل الدخول',
  loginSubtitle: 'ادخل إلى فضاء الإدارة الخاص بك.',
  username: 'اسم المستخدم',
  password: 'كلمة المرور',
  signIn: 'دخول',
  signingIn: 'جارٍ الدخول…',
  badCredentials: 'اسم المستخدم أو كلمة المرور غير صحيحة.',
  serverUnreachable: 'الخادم لا يستجيب. أعد المحاولة بعد قليل.',
  serverChecking: 'جارٍ التحقق من الخادم…',
  serverWaking: 'جارٍ تشغيل الخادم (العرض المجاني): حتى دقيقة واحدة.',
  serverReady: 'الخادم جاهز',
  oldVersion: 'النسخة القديمة',
  demoAccount: 'حساب تجريبي',
  useDemo: 'ملء',
  heroPoint1: 'المستخدمون والأدوار وصلاحيات الوصول',
  heroPoint2: 'قوائم ديناميكية حسب الدور',
  heroPoint3: 'البلدان والمدن بالفرنسية والعربية',
  required: 'حقل إلزامي',
  navigation: 'التنقل',
  dashboard: 'لوحة القيادة',
  administration: 'الإدارة',
  settings: 'الإعدادات',
  users: 'المستخدمون',
  roles: 'الأدوار',
  menus: 'القوائم',
  countries: 'البلدان',
  cities: 'المدن',
  logout: 'تسجيل الخروج',
  darkMode: 'الوضع الداكن',
  lightMode: 'الوضع الفاتح',
  language: 'Français',
  openMenu: 'فتح القائمة',
  closeMenu: 'إغلاق القائمة',
  sessionExpired: 'انتهت الجلسة، يرجى تسجيل الدخول من جديد.',
  hello: 'مرحبًا',
  dashboardIntro: 'هذه حالة تطبيقك اليوم.',
  citiesByCountry: 'المدن حسب البلد',
  usersByRole: 'المستخدمون حسب الدور',
  latestUsers: 'آخر المستخدمين',
  seeAll: 'عرض الكل',
  quickActions: 'إجراءات سريعة',
  manageUsers: 'إدارة الحسابات وأدوارها',
  manageRoles: 'تحديد صلاحيات الوصول',
  manageMenus: 'تنظيم التنقل',
  manageSettings: 'البلدان والمدن',
  search: 'بحث…',
  add: 'إضافة',
  edit: 'تعديل',
  delete: 'حذف',
  cancel: 'إلغاء',
  save: 'حفظ',
  saving: 'جارٍ الحفظ…',
  actions: 'إجراءات',
  noResults: 'لا توجد نتائج.',
  loading: 'جارٍ التحميل…',
  loadError: 'تعذر تحميل البيانات.',
  retry: 'إعادة المحاولة',
  saved: 'تم الحفظ',
  deleted: 'تم الحذف',
  saveError: 'فشل الحفظ.',
  deleteError: 'تعذر الحذف.',
  confirmDelete: 'تأكيد الحذف',
  confirmDeleteText: 'هذا الإجراء نهائي. حذف « {name} »؟',
  titleFr: 'الاسم (بالفرنسية)',
  titleAr: 'الاسم (بالعربية)',
  total: 'في المجموع',
  usersSubtitle: 'الحسابات التي لها حق الوصول إلى التطبيق.',
  newUser: 'مستخدم جديد',
  editUser: 'تعديل المستخدم',
  firstName: 'الاسم',
  lastName: 'النسب',
  login: 'المعرف',
  email: 'البريد الإلكتروني',
  phone: 'الهاتف',
  role: 'الدور',
  state: 'الحالة',
  createdAt: 'تاريخ التسجيل',
  chooseRole: 'اختر دورًا',
  confirmPassword: 'تأكيد كلمة المرور',
  passwordsDiffer: 'كلمتا المرور غير متطابقتين.',
  invalidEmail: 'بريد إلكتروني غير صالح',
  superAdminOnly: 'فقط المدير العام يمكنه تعديل هذا الحساب.',
  allRoles: 'كل الأدوار',
  active: 'نشط',
  inactive: 'غير نشط',
  rolesSubtitle: 'كل دور يمنح الوصول إلى مجموعة من القوائم.',
  newRole: 'دور جديد',
  editRole: 'تعديل الدور',
  code: 'الرمز',
  title: 'الاسم',
  accessibleMenus: 'القوائم المتاحة',
  usersCount: 'مستخدم',
  menusCount: 'قائمة',
  selectAll: 'تحديد الكل',
  roleInUse: 'هذا الدور مسند إلى مستخدمين.',
  menusSubtitle: 'يُبنى الشريط الجانبي من هذه القوائم حسب الدور.',
  newMenu: 'قائمة جديدة',
  editMenu: 'تعديل القائمة',
  url: 'العنوان (URL)',
  icon: 'الأيقونة',
  order: 'الترتيب',
  parent: 'القائمة الأم',
  noParent: 'لا شيء (قائمة رئيسية)',
  submenus: 'قائمة فرعية',
  countriesSubtitle: 'قائمة البلدان بالفرنسية والعربية.',
  newCountry: 'بلد جديد',
  editCountry: 'تعديل البلد',
  citiesSubtitle: 'قائمة المدن المرتبطة ببلد.',
  newCity: 'مدينة جديدة',
  editCity: 'تعديل المدينة',
  country: 'البلد',
  allCountries: 'كل البلدان',
  chooseCountry: 'اختر بلدًا',
  footer: 'إعادة تصميم Angular 22 + Tailwind CSS من طرف OA',
};

export type I18nKey = keyof typeof fr;

const STORAGE_KEY = 'scm_lang';

function readStored(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'fr';
  } catch {
    return 'fr';
  }
}

/** French / Arabic texts, with the page direction (RTL for Arabic). */
@Injectable({ providedIn: 'root' })
export class I18n {
  private doc = inject(DOCUMENT);
  readonly lang = signal<Lang>(readStored());
  readonly rtl = computed(() => this.lang() === 'ar');
  private dict = computed(() => (this.lang() === 'ar' ? ar : fr));

  constructor() {
    effect(() => {
      const lang = this.lang();
      this.doc.documentElement.lang = lang;
      this.doc.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
      try {
        localStorage.setItem(STORAGE_KEY, lang);
      } catch {}
    });
  }

  t(key: I18nKey, params?: Record<string, string>): string {
    let text = this.dict()[key] ?? key;
    if (params) for (const [k, v] of Object.entries(params)) text = text.replace(`{${k}}`, v);
    return text;
  }

  /** Picks the French or Arabic label of a record. */
  label(item: { titleFr?: string; titleAr?: string } | null | undefined): string {
    if (!item) return '';
    return (this.lang() === 'ar' ? item.titleAr || item.titleFr : item.titleFr || item.titleAr) ?? '';
  }

  toggle(): void {
    this.lang.update((l) => (l === 'fr' ? 'ar' : 'fr'));
  }
}

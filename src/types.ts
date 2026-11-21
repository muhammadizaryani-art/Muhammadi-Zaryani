export interface InvoiceItem {
  id: number;
  description: string;
  qty: number;
  unitPrice: number;
  discount: number;
}

export interface PaymentMethods {
  cash: boolean;
  easyPaisa: boolean;
  jazzCash: boolean;
  bank: boolean;
  whatsApp: boolean;
}

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  dueDate?: string;
  customerName: string;
  customerPhone: string;
  address: string;
  paymentMethods: PaymentMethods;
  items: InvoiceItem[];
  advance: number;
  notes: string;
  discountOverall: number;
}

export interface DomicileRecord {
  id?: number;
  applicantName: string;
  cnic: string;
  domicilePassword: string;
  applicantPicture: string; // base64 or URL
  dmcPicture: string;
  formBPicture: string;
  parentCnicPicture: string;
  otherDocumentPicture?: string;
  recordDate: string;
  status: string; // 'Pending' | 'In Progress' | 'Completed' | 'Ready'
  paymentStatus: 'PAID' | 'UNPAID' | 'PARTIALLY PAID';
  paidAmount?: number;
  totalFee?: number;
  createdAt: number;
}

export interface CVExperience {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  duration: string;
  bullets: string[];
}

export interface CVEducation {
  id: string;
  degree: string;
  institute: string;
  location: string;
  year: string;
}

export interface CVData {
  fullName: string;
  dob: string;
  gender: string;
  fatherName: string;
  maritalStatus: string;
  cnic: string;
  nationality: string;
  phone: string;
  email: string;
  location: string;
  photoUrl: string;
  summary: string;
  experiences: CVExperience[];
  education: CVEducation[];
  skills: string[];
  languages: string[];
  personalInfoFontSize?: string;
  summaryFontSize?: string;
  experienceFontSize?: string;
  educationFontSize?: string;
  skillsFontSize?: string;
  languagesFontSize?: string;
  profileNameFontSize?: string;
  personalInfoColor?: string;
  summaryColor?: string;
  experienceColor?: string;
  educationColor?: string;
  skillsColor?: string;
  languagesColor?: string;
  profileNameColor?: string;
  profileNameBold?: boolean;
  profileNameItalic?: boolean;
  personalInfoHeadingFontSize?: string;
  personalInfoHeadingColor?: string;
  personalInfoHeadingBold?: boolean;
  personalInfoHeadingItalic?: boolean;
  summaryHeadingFontSize?: string;
  summaryHeadingColor?: string;
  summaryHeadingBold?: boolean;
  summaryHeadingItalic?: boolean;
  experienceHeadingFontSize?: string;
  experienceHeadingColor?: string;
  experienceHeadingBold?: boolean;
  experienceHeadingItalic?: boolean;
  educationHeadingFontSize?: string;
  educationHeadingColor?: string;
  educationHeadingBold?: boolean;
  educationHeadingItalic?: boolean;
  skillsHeadingFontSize?: string;
  skillsHeadingColor?: string;
  skillsHeadingBold?: boolean;
  skillsHeadingItalic?: boolean;
  languagesHeadingFontSize?: string;
  languagesHeadingColor?: string;
  languagesHeadingBold?: boolean;
  languagesHeadingItalic?: boolean;
  photoSize?: string;
}

export interface CVRecord extends CVData {
  id: string;
  createdAt: number;
  updatedAt: number;
  userId?: string;
}



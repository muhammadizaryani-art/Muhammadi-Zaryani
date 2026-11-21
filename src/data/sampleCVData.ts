import { CVData } from '../types';

export const getSampleCVData = (): CVData => ({
  fullName: 'MUHAMMADI ZARYANI',
  dob: '10-06-2006',
  gender: 'MALE',
  fatherName: 'ZAFAR ALI',
  maritalStatus: 'Un-married',
  cnic: '16101-0489195-5',
  nationality: 'PAKISTANI',
  phone: '+923165069672',
  email: 'muhammadizaryani@gmail.com',
  location: 'MARDAN, KPK, PAKISTAN',
  photoUrl: '',
  summary: 'Dedicated and hardworking professional with 1 year of teaching experience at Iqra School & College, Garhi Kapora, Mardan, and 1.5 years of experience as a Computer Operator at MA Digital Store, Mohib, Mardan. Skilled in MS Office, Microsoft Word, Excel, PowerPoint, and Adobe Photoshop, with good computer operating data entry documentation and office management skills. Able to communicate professionally manage daily tasks efficiently and work effectively in a team environment.',
  experiences: [
    {
      id: '1',
      jobTitle: 'TEACHER',
      company: 'Iqra School & College, Garhi Kapora, Mardan',
      location: 'Mardan',
      duration: '1 Year',
      bullets: [
        'Taught students and conducted classroom activities.',
        'Prepared lessons and maintained classroom discipline.',
        'Assisted students in their academic learning.'
      ]
    },
    {
      id: '2',
      jobTitle: 'Computer Operator',
      company: 'MA Digital Store, Mohib, Mardan',
      location: 'Mardan',
      duration: '1.5 Years',
      bullets: [
        'Handled daily computer and data entry tasks.',
        'Worked with MS Office (Word, Excel & PowerPoint).',
        'Performed basic photo editing and design work in Adobe Photoshop.',
        'Managed printing, scanning, and document-related tasks.'
      ]
    }
  ],
  education: [
    {
      id: '1',
      degree: 'BS — In Progress',
      institute: 'Allama Iqbal Open University, Islamabad',
      location: 'Islamabad',
      year: 'Enrolled'
    },
    {
      id: '2',
      degree: 'F.Sc.',
      institute: 'Govt. Degree College, Garhi Kapora, Mardan',
      location: 'Mardan',
      year: 'Completed'
    },
    {
      id: '3',
      degree: 'Matric',
      institute: 'Nibras School & College System, Mohib, Mardan',
      location: 'Mardan',
      year: 'Completed'
    }
  ],
  skills: ['MS Office', 'Microsoft Word', 'Excel', 'PowerPoint', 'Adobe Photoshop', 'Data Entry', 'Office Management', 'Printing & Scanning'],
  languages: ['PASHTO', 'URDU', 'ENGLISH']
});

export const getInitialCVData = (): CVData => getSampleCVData();

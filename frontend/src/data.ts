import { StudentData } from './types';

export const MOCK_STUDENTS: StudentData[] = [
  {
    id: "stu_101",
    name: { value: "Priya Sharma", confidence: "high" },
    domain: { value: "Frontend Engineering", confidence: "high" },
    skills: { value: "React, TypeScript, Tailwind, Redux", confidence: "high" },
    experience: { value: "8 mos Intern @ WebCorp", confidence: "medium" },
    role: { value: "UI Developer", confidence: "high" },
    atsScore: { value: 92, confidence: "high" },
    githubInfo: { value: "42 Repos | 120 Contribs", confidence: "high" },
    resumeUrl: "/resumes/priya_sharma_2024.pdf",
    knockoutResults: {},
    resumeText: {
      header: "Priya Sharma",
      contact: "priya.s@student.edu | github.com/priyasharma (Verified)",
      summary: "Passionate Frontend Developer specializing in building accessible and performant web applications with modern JavaScript frameworks.",
      skills: "Technical Skills: React, TypeScript, Tailwind CSS, Redux, Jest, Figma.",
      experience: "Experience: Frontend Intern at WebCorp (8 months) - Led the migration of legacy dashboard to React 18 resulting in 30% load speed improvement.",
      education: "B.Tech Computer Science, ABC University, CGPA 8.9"
    }
  },
  {
    id: "stu_102",
    name: { value: "Rahul Desai", confidence: "high" },
    domain: { value: "Backend Systems", confidence: "medium" },
    skills: { value: "Java, Spring Boot, MySQL", confidence: "high" },
    experience: { value: "No explicit experience", confidence: "low" },
    role: { value: "Java Developer", confidence: "medium" },
    atsScore: { value: 78, confidence: "medium" },
    githubInfo: { value: "12 Repos | 15 Contribs", confidence: "medium" },
    resumeUrl: "/resumes/rahul_desai_cv.pdf",
    knockoutResults: {},
    resumeText: {
      header: "Rahul Desai",
      contact: "r.desai@student.edu | github.com/rdesai",
      summary: "Aspiring backend software engineer eager to solve complex data challenges. Strong analytical skills and algorithmic foundations.",
      skills: "Core Technologies: Java, Spring Boot, Hibernate, MySQL, Git, Docker.",
      experience: "Projects: Built a scalable Library Management System API handling 100+ concurrent requests using Spring MVC.",
      education: "B.Tech Information Technology, ABC University, CGPA 8.1"
    }
  },
  {
    id: "stu_103",
    name: { value: "Aisha Khan", confidence: "high" },
    domain: { value: "Data Science", confidence: "high" },
    skills: { value: "Python, TensorFlow, SQL, Pandas", confidence: "high" },
    experience: { value: "1 yr RA @ ML Lab", confidence: "high" },
    role: { value: "Data Analyst", confidence: "high" },
    atsScore: { value: 95, confidence: "high" },
    githubInfo: { value: "85 Repos | Kaggler (Expert)", confidence: "high" },
    resumeUrl: "/resumes/aisha_khan_data.pdf",
    knockoutResults: {},
    resumeText: {
      header: "Aisha Khan",
      contact: "akhan@student.edu | kaggle.com/aishak",
      summary: "Data Scientist with a proven track record of applying machine learning models to real-world datasets, actively researching NLP.",
      skills: "Languages & Tools: Python, TensorFlow, PyTorch, SQL, Pandas, Scikit-Learn, Tableau.",
      experience: "Experience: 1 year Research Assistant at AI Lab - Published paper on contextual word embeddings. Deployed models serving 10k predictions/day.",
      education: "Dual Degree CS/Math, ABC University, CGPA 9.4"
    }
  },
  {
    id: "stu_104",
    name: { value: "Vikram Singh", confidence: "low" },
    domain: { value: "Frontend Engineering", confidence: "high" },
    skills: { value: "Vue.js, JavaScript, HTML, CSS", confidence: "medium" },
    experience: { value: "Freelance", confidence: "low" },
    role: { value: "Frontend Dev", confidence: "medium" },
    atsScore: { value: 65, confidence: "low" },
    githubInfo: { value: "8 Repos", confidence: "low" },
    resumeUrl: "/resumes/v_singh.pdf",
    knockoutResults: {},
    resumeText: {
      header: "V. Singh",
      contact: "vsingh@student.edu",
      summary: "Web developer.",
      skills: "Vue, JS, HTML, CSS",
      experience: "Freelance web development.",
      education: "BCA, XYZ College"
    }
  },
  {
    id: "stu_105",
    name: { value: "Meera Patel", confidence: "high" },
    domain: { value: "Data Science", confidence: "medium" },
    skills: { value: "Python, MongoDB, Tableau", confidence: "high" },
    experience: { value: "6 mos Data Intern", confidence: "high" },
    role: { value: "Data Analyst", confidence: "medium" },
    atsScore: { value: 88, confidence: "high" },
    githubInfo: { value: "22 Repos", confidence: "medium" },
    resumeUrl: "/resumes/meerapatel.pdf",
    knockoutResults: {},
    resumeText: {
      header: "Meera Patel",
      contact: "meera.p@student.edu",
      summary: "Data enthusiast looking for analytics roles.",
      skills: "Python, SQL, MongoDB, Tableau",
      experience: "6 months intern at DataX.",
      education: "B.Tech IT"
    }
  },
  {
    id: "stu_106",
    name: { value: "Arjun Reddy", confidence: "high" },
    domain: { value: "Backend Systems", confidence: "high" },
    skills: { value: "Node.js, Express, Postgres", confidence: "high" },
    experience: { value: "1 yr SDE Intern", confidence: "high" },
    role: { value: "Backend Engineer", confidence: "high" },
    atsScore: { value: 91, confidence: "high" },
    githubInfo: { value: "54 Repos | 200 Contribs", confidence: "high" },
    resumeUrl: "/resumes/arjun_reddy.pdf",
    knockoutResults: {},
    resumeText: {
      header: "Arjun Reddy",
      contact: "arjun@student.edu",
      summary: "Backend engineer focused on scalable architectures.",
      skills: "Node.js, Express, Postgres, Docker, AWS",
      experience: "1 yr SDE intern at ScaleTech.",
      education: "B.Tech CS"
    }
  },
  {
    id: "stu_107",
    name: { value: "Sarah Jones", confidence: "high" },
    domain: { value: "Full Stack", confidence: "high" },
    skills: { value: "React, Node.js, MongoDB", confidence: "high" },
    experience: { value: "Projects Only", confidence: "medium" },
    role: { value: "Full Stack Dev", confidence: "medium" },
    atsScore: { value: 82, confidence: "medium" },
    githubInfo: { value: "30 Repos", confidence: "medium" },
    resumeUrl: "/resumes/sjones.pdf",
    knockoutResults: {},
    resumeText: {
      header: "Sarah Jones",
      contact: "sarah.j@student.edu",
      summary: "Full stack developer.",
      skills: "React, Node.js, MongoDB",
      experience: "Built E-commerce platform.",
      education: "B.Sc Computer Science"
    }
  }
];

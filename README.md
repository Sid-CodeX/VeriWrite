# ✍️ VeriWrite — Intelligent Handwritten Plagiarism Detection System

VeriWrite is an innovative web-based platform designed to detect plagiarism in **Handwritten academic submissions**. Built specifically for classroom environments, VeriWrite leverages advanced OCR and similarity detection algorithms to compare student submissions and generate insightful plagiarism reports. Empower educators, preserve academic integrity, and revolutionize assignment evaluation.

---

## 🚀 Key Features

- 🔐 **Secure Authentication** for Teachers & Students (Email & Google OAuth)
- 🏫 **Classroom Management**: Create, join, and manage virtual classrooms
- 📄 **Assignment & Exam Posting**: Upload questions, set deadlines, and track submissions
- 📝 **Handwritten Text Extraction** using Microsoft OCR (with future Tesseract integration)
- 🧠 **Plagiarism Detection**:
  - Jaccard similarity-based exact matching
  - Grouping of students with similar content
  - PDF reports for download and analysis
- 🌐 **Online Plagiarism Check** 
- 📊 **Dashboard for Teachers & Students**: Organized views of courses, submissions, and results
- 📥 **Document Upload Support**: Accepts PDFs, Word Docs, and image files

---

## 🖥️ Tech Stack

| Layer          | Technologies Used                                         |
|----------------|-----------------------------------------------------------|
| Frontend       | React.js, Tailwind CSS, HTML/CSS (UI from Loveable AI)    |
| Backend        | Node.js, Express.js                                       |
| Database       | MongoDB (via Mongoose ORM)                                |
| Authentication | JWT, Google OAuth                                         |
| OCR Engine     | Microsoft Azure OCR API *(Tesseract integration planned)* |
| Deployment     | *(To be deployed)*       |

---

## 🛠️ Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/veriwrite.git
cd veriwrite

# 2. Navigate to frontend & install
cd frontend
npm install
npm start

# 3. Navigate to backend & install
cd ../backend
npm install
npm run dev
```

🔑 Don't forget to add your .env files in both frontend and backend folders.


🧪 How It Works

✍️ Student uploads handwritten assignment
🧾 OCR extracts text from document
📊 Text is compared against all other submissions in the course
⚖️ Plagiarism percentage calculated via exact match (Jaccard Similarity)
📄 PDF report is generated, highlighting similar submissions

👥 Team VeriWrite
Sidharth P
Rahul Koshy Manoj	
Mariya Jose	
Archana Mukundan	

🏫 Proudly developed as part of a 6th semester Mini Project under the guidance of Dr.Sreenu G,CSE Department, Muthoot Institute of Technology and Science (MITS).

📌 Future Improvements

🤖 Integrate fine-tuned Tesseract model for custom handwriting
🔍 Semantic plagiarism detection using BERT embeddings
📥 Bulk assignment upload for teachers
🔄 Auto grading against teacher’s model answers
🌐 Expand online content comparison

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

## 🤝 Contributing

We welcome contributions! Feel free to fork this repo, suggest enhancements, or submit pull requests.

## 📬 Contact Us

Have feedback or questions? Reach out via [GitHub Issues](https://github.com/sidharthp-2004/veriwrite/issues) or connect with any team member.

---

Engineered with precision and passion by **Team VeriWrite**

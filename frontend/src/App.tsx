import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { IntakeForm } from "./pages/IntakeForm";
import { JobStatusPage } from "./pages/JobStatus";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<IntakeForm />} />
        <Route path="/jobs/:jobId" element={<JobStatusPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

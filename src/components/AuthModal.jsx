import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "../lib/supabaseClient";

export default function AuthModal({ isOpen, mode = "login", onClose, onSuccess, setMode }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        onSuccess?.(data?.user || null);
        onClose?.();
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onSuccess?.(data?.user || null);
        onClose?.();
      }
    } catch (err) {
      setError(err.message || "Authentication failed");
      setLoading(false);
    }
  };

  const sendMagicLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } });
      if (error) throw error;
      alert('Magic link sent! Check your email to continue.');
    } catch (err) {
      setError(err.message || 'Failed to send magic link');
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordReset = async () => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin });
      if (error) throw error;
      alert('Password reset email sent.');
    } catch (err) {
      setError(err.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  const signInWithProvider = async (provider) => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider, options: { redirectTo: window.location.origin } });
      if (error) throw error;
    } catch (err) {
      setError(err.message || 'OAuth sign-in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{mode === "signup" ? "Create your account" : "Welcome back"}</h3>
              <button onClick={onClose} className="text-gray-500 hover:text-black text-sm">Close</button>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <div>
                <label className="text-xs text-gray-600">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-600">Password</label>
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
              </div>

              {error && <div className="text-xs text-red-600">{error}</div>}

              <button type="submit" disabled={loading} className="relative w-full px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:text-black hover:border-gray-300 overflow-hidden">
                <span className="relative z-10">{loading ? (mode === "signup" ? "Creating..." : "Signing in...") : (mode === "signup" ? "Sign up" : "Log in")}</span>
              </button>
            </form>

            <div className="mt-2 grid grid-cols-1 gap-2">
              <button onClick={sendMagicLink} disabled={loading || !email} className="text-xs underline text-gray-700 hover:text-black text-left">Send magic link to email</button>
              <button onClick={sendPasswordReset} disabled={loading || !email} className="text-xs underline text-gray-700 hover:text-black text-left">Forgot password? Reset</button>
            </div>

            <div className="mt-3">
              <div className="text-center text-xs text-gray-500 mb-2">or continue with</div>
              <div className="flex gap-2">
                <button onClick={() => signInWithProvider('google')} className="flex-1 px-3 py-1.5 border rounded-lg text-xs">Google</button>
                <button onClick={() => signInWithProvider('github')} className="flex-1 px-3 py-1.5 border rounded-lg text-xs">GitHub</button>
              </div>
            </div>

            <div className="mt-3 text-center text-xs text-gray-600">
              {mode === "signup" ? (
                <>Already have an account? <button className="underline" onClick={() => setMode?.("login")}>Log in</button></>
              ) : (
                <>New here? <button className="underline" onClick={() => setMode?.("signup")}>Create account</button></>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

import cookie from "js-cookie";
/** Set value in cookies */
export const setCookie = (name: string, value: string, time?: number) => {
  const times = parseInt(cookie.get("times") ?? "0", 10) || 0;
  cookie.set("times", `${times + 1}`);

  // Cookies with `secure: true` are ignored by browsers on non-HTTPS origins (e.g. http://localhost).
  // In production we still want `secure: true`.
  const isSecure =
    typeof window !== "undefined"
      ? window.location.protocol === "https:"
      : process.env.NODE_ENV === "production";

  cookie.set(name, value, {
    path: "/",
    expires: new Date(new Date().getTime() + (time ?? 36000)),
    secure: isSecure,
  });
};

declare global {
  interface Window {
    getGlobal?: (key: string) => string | null;
  }
}

window.getGlobal = (key: string): string | null => {
  if (key === "userid") {
    const el = document.getElementById("hidden-userid");
    return el ? el.getAttribute("data-userid") : null;
  }
  return null;
};

export {};
import React from "react";
import alexisOmegaIcon from "../assets/icons/alexisomega.svg";

const Footer = () => {
  return (
    <footer className="w-full bg-gray-100 border-t mt-10">
      <div className="max-w-6xl mx-auto py-4 px-6 flex flex-col items-center justify-center gap-2 text-gray-500 text-sm">
        <img src={alexisOmegaIcon} alt="Alexis Omega" className="h-8 mb-1" />
        <span>
          © {new Date().getFullYear()} BonanzApp. All rights reserved.
        </span>
      </div>
    </footer>
  );
};

export default Footer;

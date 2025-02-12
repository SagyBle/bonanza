import React from "react";
import alexisOmegaIcon from "../assets/icons/alexisomega.svg";

const Footer = () => {
  return (
    <div className="w-full flex items-center justify-center py-4 ">
      <div className="flex items-center gap-4">
        <div className="h-px w-16 bg-gray-500"></div>
        <img src={alexisOmegaIcon} alt="Alexis Omega" className="h-8" />
        <div className="h-px w-16 bg-gray-500"></div>
      </div>
    </div>
  );
};

export default Footer;

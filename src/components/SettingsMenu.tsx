import React, { useState, useRef, useEffect } from "react";
import SettingsIcon from "./SettingsIcon";
import "./SettingsMenu.css";

interface SettingsMenuProps {
  useRealisticGlobe: boolean;
  toggleGlobeStyle: () => void;
}

const SettingsMenu: React.FC<SettingsMenuProps> = ({
  useRealisticGlobe,
  toggleGlobeStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  // Handle setting the globe to Simple
  const setSimpleGlobe = () => {
    if (useRealisticGlobe) {
      toggleGlobeStyle();
    }
  };

  // Handle setting the globe to Realistic
  const setRealisticGlobe = () => {
    if (!useRealisticGlobe) {
      toggleGlobeStyle();
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="settings-container" ref={menuRef}>
      <div className="settings-icon-wrapper">
        <SettingsIcon onClick={toggleMenu} size={28} />
      </div>

      {isOpen && (
        <div className="settings-panel">
          <div className="settings-header">
            <h3>Settings</h3>
          </div>
          <div className="settings-content">
            <div className="settings-option">
              <span>Globe Style</span>
              <div className="toggle-switch-container">
                <button
                  className={`style-button ${
                    !useRealisticGlobe ? "active" : ""
                  }`}
                  onClick={setSimpleGlobe}
                >
                  Simple
                </button>
                <button
                  className={`style-button ${
                    useRealisticGlobe ? "active" : ""
                  }`}
                  onClick={setRealisticGlobe}
                >
                  Realistic
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;

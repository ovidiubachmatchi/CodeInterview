import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function BasicSelect({ onLanguageChange, selectedLanguage }) {
  const [value, setValue] = useState(selectedLanguage);

  useEffect(() => {
    setValue(selectedLanguage);
  }, [selectedLanguage]);

  useEffect(() => {
    if (value !== selectedLanguage) {
      setValue(value);
    }
  }, [value, selectedLanguage, onLanguageChange]);

  const handleChange = (event) => {
    setValue(event.target.value);
  };
  return (
    <>
      <Select>
      </Select>
    </>
  )
  /*
    return (
      <>
        <Box sx={{ minWidth: 120 }}>
          <FormControl fullWidth>
            <Select
              labelId="selector-label"
              id="selector"
              value={value}
              onChange={handleChange}
            >
              <MenuItem value="Java">Java</MenuItem>
              <MenuItem value="Javascript">Javascript</MenuItem>
              <MenuItem value="Python">Python</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </>
    );
  */
}

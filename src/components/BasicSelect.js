import {useState, useEffect} from 'react';
import Box from '@mui/material/Box';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select from '@mui/material/Select';

export default function BasicSelect({setLanguage}) {
  const [value, setValue] = useState('java');

  useEffect(() => {
    setLanguage(value);
  });

  const handleChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth>
        <Select
          labelId="selector-label"
          id="selector"
          value={value}
          onChange={handleChange}
        >
          <MenuItem value="java">Java</MenuItem>
          <MenuItem value="javascript">Javascript</MenuItem>
          <MenuItem value="python">Python</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
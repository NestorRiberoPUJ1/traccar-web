import React, { useState } from 'react';
import { Autocomplete, TextField } from '@mui/material';

const PlaceSearch = () => {
  const [value, setValue] = useState('');
  const [inputValue, setInputValue] = useState('');

  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);
    console.log(newInputValue);
  };
  const handleBlur = (e) => {
    console.log(e);
  };

  return (
    <Autocomplete
      freeSolo
      id="free-solo-2-demo"
      value={value}
      onChange={(event, newValue) => {
        setValue(newValue);
      }}
      inputValue={inputValue}
      onInputChange={handleInputChange}
      onBlur={handleBlur}
      disableClearable
      options={[]}
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search input"
          InputProps={{
            ...params.InputProps,
            type: 'search',
          }}
        />
      )}
    />
  );
};

export default PlaceSearch;

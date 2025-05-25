'use client';

import * as React from 'react';
import { Check, ChevronsUpDown } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from './input';

interface ComboboxProps {
    options: { label: string; value: string }[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    inputPlaceholder?: string;
    className?: string;
}

export function Combobox({
    options,
    value,
    onChange,
    placeholder = 'Select option...',
    inputPlaceholder = 'Search option...',
    className,
}: ComboboxProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(value || '');

    React.useEffect(() => {
        const selectedOption = options.find((option) => option.value === value);
        setInputValue(selectedOption ? selectedOption.label : value || '');
    }, [value, options]);

    const handleSelect = (currentValue: string) => {
        const newValue = currentValue === value ? '' : currentValue;
        onChange(newValue);
        const selectedOption = options.find(
            (option) => option.value === newValue,
        );
        setInputValue(selectedOption ? selectedOption.label : newValue);
        setOpen(false);
    };

    const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const currentInputValue = event.target.value;
        setInputValue(currentInputValue);

        const matchedOption = options.find(
            (option) =>
                option.label.toLowerCase() === currentInputValue.toLowerCase(),
        );
        if (matchedOption) {
            onChange(matchedOption.value);
        } else {
            onChange(currentInputValue);
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        'w-full justify-between font-normal',
                        className,
                    )}
                >
                    {value
                        ? options.find((option) => option.value === value)
                              ?.label || value
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command shouldFilter={true}>
                    {/* Use a regular input for typing, CommandInput for filtering existing items */}
                    <CommandInput
                        placeholder={inputPlaceholder}
                        value={inputValue}
                        onValueChange={(search) => {
                            setInputValue(search);
                        }}
                    />
                    <CommandList>
                        <CommandEmpty>
                            {inputValue
                                ? `"${inputValue}" akan ditambahkan sebagai alasan baru.`
                                : 'Tidak ada opsi ditemukan.'}
                        </CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={(currentLabel) => {
                                        const selectedOpt = options.find(
                                            (opt) => opt.label === currentLabel,
                                        );
                                        if (selectedOpt) {
                                            handleSelect(selectedOpt.value);
                                        }
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            'mr-2 h-4 w-4',
                                            value === option.value
                                                ? 'opacity-100'
                                                : 'opacity-0',
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                            {/* Option to add current input value if it's not in the list */}
                            {inputValue &&
                                !options.some(
                                    (opt) =>
                                        opt.label.toLowerCase() ===
                                        inputValue.toLowerCase(),
                                ) && (
                                    <CommandItem
                                        key={inputValue}
                                        value={inputValue}
                                        onSelect={() => {
                                            handleSelect(inputValue);
                                        }}
                                        className="italic"
                                    >
                                        <Check
                                            className={cn(
                                                'mr-2 h-4 w-4 opacity-0',
                                            )}
                                        />
                                        Tambah: "{inputValue}"
                                    </CommandItem>
                                )}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}

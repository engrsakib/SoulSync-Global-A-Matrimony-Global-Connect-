'use client';

import * as React from 'react';
import type { BiodataIslamShariaSectionPatch, BiodataMeDto } from '@soulsync/shared-types/biodata';
import {
  CLOTHING_ABOVE_ANKLES_LABELS,
  CLOTHING_ABOVE_ANKLES_VALUES,
  HIJAB_PURDAH_LABELS,
  HIJAB_PURDAH_VALUES,
  ISLAM_SHARIA_TEXT_MAX_WORDS,
  MAHRAM_COMPLIANCE_LABELS,
  MAHRAM_COMPLIANCE_VALUES,
  PRAYER_REGULARITY_LABELS,
  PRAYER_REGULARITY_VALUES,
  QURAN_RECITATION_LEVEL_LABELS,
  QURAN_RECITATION_LEVEL_VALUES,
  shouldShowBeardFields,
  shouldShowHijabField,
  SUNNAH_BEARD_STATUS_LABELS,
  SUNNAH_BEARD_STATUS_VALUES,
  type ClothingAboveAnkles,
  type HijabPurdah,
  type MahramCompliance,
  type PrayerRegularity,
  type QuranRecitationLevel,
  type SunnahBeardStatus,
} from '@soulsync/shared-types/islam-sharia';
import { countWords, limitToMaxWords } from '@soulsync/shared-types/word-limit';
import { Label } from '@soulsync/ui/label';
import { cn } from '@soulsync/ui/lib/utils';
import { SelectWithChevron } from '@/components/dashboard/searchable-select-field';
import { btnPrimaryMd, formControlClass } from '@/lib/ui-classes';

const inputClass = formControlClass;

const sectionSubheadingClass = 'text-sm font-semibold tracking-tight text-[var(--foreground)]';

function WordLimitedTextarea({
  id,
  label,
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <textarea
        id={id}
        rows={rows}
        className={cn(inputClass, 'mt-1.5 h-auto min-h-[5.5rem] py-2')}
        value={value}
        onChange={(e) => onChange(limitToMaxWords(e.target.value, ISLAM_SHARIA_TEXT_MAX_WORDS))}
        placeholder={placeholder}
      />
      <p className="text-muted-foreground mt-1 text-xs">
        {countWords(value)} / {ISLAM_SHARIA_TEXT_MAX_WORDS} words
      </p>
    </div>
  );
}

function RadioOption({
  name,
  value,
  checked,
  label,
  onChange,
}: {
  name: string;
  value: string;
  checked: boolean;
  label: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2 text-sm">
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        className="mt-0.5"
        onChange={() => onChange(value)}
      />
      <span>{label}</span>
    </label>
  );
}

export function IslamShariaForm({
  profile,
  pending,
  onSave,
}: {
  profile: BiodataMeDto['profile'];
  pending: boolean;
  onSave: (body: BiodataIslamShariaSectionPatch) => void;
}) {
  const showBeard = shouldShowBeardFields(profile.gender);
  const showHijab = shouldShowHijabField(profile.gender);

  const [prayerRegularity, setPrayerRegularity] = React.useState(profile.prayerRegularity ?? '');
  const [missedFardPrayersNotes, setMissedFardPrayersNotes] = React.useState(
    profile.missedFardPrayersNotes ?? '',
  );
  const [aqeedahNotes, setAqeedahNotes] = React.useState(profile.aqeedahNotes ?? '');
  const [sunnahBeardStatus, setSunnahBeardStatus] = React.useState(profile.sunnahBeardStatus ?? '');
  const [beardDetails, setBeardDetails] = React.useState(profile.beardDetails ?? '');
  const [usualOutdoorClothing, setUsualOutdoorClothing] = React.useState(
    profile.usualOutdoorClothing ?? '',
  );
  const [quranRecitationLevel, setQuranRecitationLevel] = React.useState(
    profile.quranRecitationLevel ?? '',
  );
  const [favoriteIslamicBooks, setFavoriteIslamicBooks] = React.useState(
    profile.favoriteIslamicBooks ?? '',
  );
  const [favoriteScholars, setFavoriteScholars] = React.useState(profile.favoriteScholars ?? '');
  const [clothingAboveAnkles, setClothingAboveAnkles] = React.useState(
    profile.clothingAboveAnkles ?? '',
  );
  const [mahramCompliance, setMahramCompliance] = React.useState(profile.mahramCompliance ?? '');
  const [entertainmentHabits, setEntertainmentHabits] = React.useState(
    profile.entertainmentHabits ?? '',
  );
  const [dawahInvolvement, setDawahInvolvement] = React.useState(profile.dawahInvolvement ?? '');
  const [quranHifzNotes, setQuranHifzNotes] = React.useState(profile.quranHifzNotes ?? '');
  const [incomeFullyHalal, setIncomeFullyHalal] = React.useState(profile.incomeFullyHalal === true);
  const [hijabPurdah, setHijabPurdah] = React.useState(profile.hijabPurdah ?? '');

  const buildBody = (): BiodataIslamShariaSectionPatch => {
    const body: BiodataIslamShariaSectionPatch = {
      prayerRegularity: (prayerRegularity || null) as PrayerRegularity | null,
      missedFardPrayersNotes: missedFardPrayersNotes.trim() || null,
      aqeedahNotes: aqeedahNotes.trim() || null,
      usualOutdoorClothing: usualOutdoorClothing.trim() || null,
      quranRecitationLevel: (quranRecitationLevel || null) as QuranRecitationLevel | null,
      favoriteIslamicBooks: favoriteIslamicBooks.trim() || null,
      favoriteScholars: favoriteScholars.trim() || null,
      clothingAboveAnkles: (clothingAboveAnkles || null) as ClothingAboveAnkles | null,
      mahramCompliance: (mahramCompliance || null) as MahramCompliance | null,
      entertainmentHabits: entertainmentHabits.trim() || null,
      dawahInvolvement: dawahInvolvement.trim() || null,
      quranHifzNotes: quranHifzNotes.trim() || null,
      incomeFullyHalal: incomeFullyHalal ? true : null,
    };
    if (showBeard) {
      body.sunnahBeardStatus = (sunnahBeardStatus || null) as SunnahBeardStatus | null;
      body.beardDetails = beardDetails.trim() || null;
    }
    if (showHijab) {
      body.hijabPurdah = (hijabPurdah || null) as HijabPurdah | null;
    }
    return body;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className={sectionSubheadingClass}>Salah and aqeedah</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <fieldset className="sm:col-span-2">
            <legend className="mb-2 text-sm font-medium">
              Do you pray five times daily or regularly in congregation?
            </legend>
            <div className="flex flex-col gap-2">
              {PRAYER_REGULARITY_VALUES.map((value) => (
                <RadioOption
                  key={value}
                  name="prayerRegularity"
                  value={value}
                  checked={prayerRegularity === value}
                  label={PRAYER_REGULARITY_LABELS[value]}
                  onChange={setPrayerRegularity}
                />
              ))}
              <RadioOption
                name="prayerRegularity"
                value=""
                checked={prayerRegularity === ''}
                label="— Prefer not to answer"
                onChange={() => setPrayerRegularity('')}
              />
            </div>
          </fieldset>

          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="missedFardPrayersNotes"
              label="Approximately how many fard prayers are qada or might be?"
              value={missedFardPrayersNotes}
              onChange={setMissedFardPrayersNotes}
              placeholder="e.g. Alhamdulillah, none now / occasionally"
            />
          </div>

          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="aqeedahNotes"
              label="Aqeedah and religious orientation"
              value={aqeedahNotes}
              onChange={setAqeedahNotes}
              placeholder="e.g. Ahle Sunnah wal Jamaah (Hanafi)"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className={sectionSubheadingClass}>Appearance, dress, and boundaries</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {showBeard ? (
            <>
              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-sm font-medium">Do you keep a Sunnah beard?</legend>
                <div className="flex flex-col gap-2">
                  {SUNNAH_BEARD_STATUS_VALUES.map((value) => (
                    <RadioOption
                      key={value}
                      name="sunnahBeardStatus"
                      value={value}
                      checked={sunnahBeardStatus === value}
                      label={SUNNAH_BEARD_STATUS_LABELS[value]}
                      onChange={setSunnahBeardStatus}
                    />
                  ))}
                  <RadioOption
                    name="sunnahBeardStatus"
                    value=""
                    checked={sunnahBeardStatus === ''}
                    label="— Prefer not to answer"
                    onChange={() => setSunnahBeardStatus('')}
                  />
                </div>
              </fieldset>
              <div className="sm:col-span-2">
                <WordLimitedTextarea
                  id="beardDetails"
                  label="Beard details (since when, style)"
                  value={beardDetails}
                  onChange={setBeardDetails}
                  placeholder="e.g. Fist-length Sunnah beard for 4 years"
                  rows={2}
                />
              </div>
            </>
          ) : null}

          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="usualOutdoorClothing"
              label="Usual clothing when going out"
              value={usualOutdoorClothing}
              onChange={setUsualOutdoorClothing}
              placeholder="e.g. Panjabi and pyjama, or cap and panjabi"
            />
          </div>

          <SelectWithChevron
            id="quranRecitationLevel"
            label="Can you recite the Quran with tajweed?"
            value={quranRecitationLevel}
            onChange={(e) => setQuranRecitationLevel(e.target.value)}
          >
            <option value="">—</option>
            {QURAN_RECITATION_LEVEL_VALUES.map((value) => (
              <option key={value} value={value}>
                {QURAN_RECITATION_LEVEL_LABELS[value]}
              </option>
            ))}
          </SelectWithChevron>

          <SelectWithChevron
            id="clothingAboveAnkles"
            label="Do you wear clothing above the ankles?"
            value={clothingAboveAnkles}
            onChange={(e) => setClothingAboveAnkles(e.target.value)}
          >
            <option value="">—</option>
            {CLOTHING_ABOVE_ANKLES_VALUES.map((value) => (
              <option key={value} value={value}>
                {CLOTHING_ABOVE_ANKLES_LABELS[value]}
              </option>
            ))}
          </SelectWithChevron>

          <SelectWithChevron
            id="mahramCompliance"
            label="Mahram / non-mahram boundaries"
            value={mahramCompliance}
            onChange={(e) => setMahramCompliance(e.target.value)}
          >
            <option value="">—</option>
            {MAHRAM_COMPLIANCE_VALUES.map((value) => (
              <option key={value} value={value}>
                {MAHRAM_COMPLIANCE_LABELS[value]}
              </option>
            ))}
          </SelectWithChevron>

          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="favoriteIslamicBooks"
              label="Favourite Islamic books and reading"
              value={favoriteIslamicBooks}
              onChange={setFavoriteIslamicBooks}
              placeholder="e.g. Ar-Raheeq Al-Makhtum, Seeratun Nabi (SAW)"
            />
          </div>

          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="favoriteScholars"
              label="Favourite scholars and authors"
              value={favoriteScholars}
              onChange={setFavoriteScholars}
              placeholder="Optional"
            />
          </div>

          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="entertainmentHabits"
              label="Entertainment and leisure habits"
              value={entertainmentHabits}
              onChange={setEntertainmentHabits}
              placeholder="e.g. Avoid TV and music; prefer Islamic gatherings"
            />
          </div>

          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="dawahInvolvement"
              label="Dawah or religious community involvement"
              value={dawahInvolvement}
              onChange={setDawahInvolvement}
              placeholder="e.g. Tabligh or local halqa from time to time"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className={sectionSubheadingClass}>Hifz and halal income</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <WordLimitedTextarea
              id="quranHifzNotes"
              label="Quran recitation ability and hifz"
              value={quranHifzNotes}
              onChange={setQuranHifzNotes}
              placeholder="e.g. Daily reading with meaning / Hafiz-e-Quran"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={incomeFullyHalal}
                onChange={(e) => setIncomeFullyHalal(e.target.checked)}
              />
              <span>
                Is your and your family&apos;s income fully halal? — Alhamdulillah, fully halal and
                free from riba and bribery
              </span>
            </label>
          </div>
        </div>
      </div>

      {showHijab ? (
        <div className="space-y-4">
          <h3 className={sectionSubheadingClass}>Hijab / purdah</h3>
          <SelectWithChevron
            id="hijabPurdah"
            label="Hijab / purdah"
            value={hijabPurdah}
            onChange={(e) => setHijabPurdah(e.target.value)}
          >
            <option value="">—</option>
            {HIJAB_PURDAH_VALUES.map((value) => (
              <option key={value} value={value}>
                {HIJAB_PURDAH_LABELS[value]}
              </option>
            ))}
          </SelectWithChevron>
        </div>
      ) : null}

      <div className="flex justify-end">
        <button
          type="button"
          className={btnPrimaryMd}
          disabled={pending}
          onClick={() => onSave(buildBody())}
        >
          {pending ? 'Saving…' : 'Save section'}
        </button>
      </div>
    </div>
  );
}

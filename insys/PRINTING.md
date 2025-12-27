Label printing recommendations

- Use CODE 128 for barcodes (our app now renders CODE128 SVG).
- Print scale: choose "Actual size" or 100% in the print dialog (do NOT use Fit-to-page).
- Disable browser headers/footers in the print dialog (they commonly show page URL like `about:blank`).
- Printer darkness: increase darkness/print density in the printer driver or label software (ZebraDesigner/BarTender). For Zebra printers you can also set darkness in ZPL with `^MD`.
- Quiet zones: keep at least 4-5 mm left/right quiet zones. The app prints the barcode at 40mm wide inside a 50mm label to preserve quiet zones.
- Bar height: use at least 6-10 mm (we render taller bars; use label software or adjust `height` in the component if needed).
- Best practice: create label templates in dedicated label software (ZebraDesigner / BarTender) and send ZPL or native print jobs to the printer for most reliable results.

Quick dev steps

1. Install the new dependency in the `insys` folder:

```bash
cd insys
npm install
```

2. Run the dev server and test printing from the barcode component by clicking it.

Notes

- The browser cannot forcibly remove printed header/footer — disabling them in the print dialog is usually required.
- To control print darkness or advanced label features, prefer generating ZPL or using ZebraDesigner/BarTender.

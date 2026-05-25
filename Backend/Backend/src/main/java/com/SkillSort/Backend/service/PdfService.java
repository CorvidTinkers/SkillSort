package com.SkillSort.Backend.service;

import com.SkillSort.Backend.model.PdfExtractionResult;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

@Service
public class PdfService {

    public List<PdfExtractionResult> extractFromZip(MultipartFile zipFile) throws IOException {
        if (zipFile.isEmpty()) {
            throw new IllegalArgumentException("Cannot parse an empty file!");
        }

        List<PdfExtractionResult> extractedResults = new ArrayList<>();

        try (ZipInputStream zis = new ZipInputStream(zipFile.getInputStream())) {
            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                if (!entry.isDirectory() && entry.getName().toLowerCase().endsWith(".pdf")) {
                    byte[] pdfBytes = zis.readAllBytes();
                    
                    String id = UUID.randomUUID().toString();
                    String savedFileName = id + ".pdf";

                    try (PDDocument document = Loader.loadPDF(pdfBytes)) {
                        PDFTextStripper stripper = new PDFTextStripper();
                        stripper.setSortByPosition(true);
                        String text = stripper.getText(document);
                        
                        extractedResults.add(new PdfExtractionResult(
                            id,
                            entry.getName(),
                            savedFileName,
                            text.trim(),
                            pdfBytes
                        ));
                    } catch (Exception e) {
                        System.err.println("Failed to parse PDF in memory: " + entry.getName());
                        e.printStackTrace();
                    }
                }
                zis.closeEntry();
            }
        }
        return extractedResults;
    }
}
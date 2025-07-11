package com.example.chatbot.service;

import ai.djl.Application;
import ai.djl.inference.Predictor;
import ai.djl.modality.Classifications;
import ai.djl.repository.zoo.Criteria;
import ai.djl.repository.zoo.ModelNotFoundException;
import ai.djl.repository.zoo.ZooModel;
import ai.djl.training.util.ProgressBar;
//import ai.djl.translate.TranslateException;
import com.example.chatbot.utils.LoggerUtil;
import org.slf4j.Logger;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

@Service
public class IssueClassifierService {

    private static final Logger logger = LoggerUtil.getLogger(IssueClassifierService.class);
    private Predictor<String, Classifications> predictor;
    private final MyTranslator translator;

    public IssueClassifierService(MyTranslator translator) throws Exception {
        this.translator = translator;
        logger.info("Loading model...");

        try {
            java.net.URL modelUrl = getClass().getResource("/model/model_distill_bert.pt");
            if (modelUrl == null) {
                throw new ModelNotFoundException("Model not found in classpath");
            }
            try (InputStream is = modelUrl.openStream()) {
                Path modelDir = Files.createTempDirectory("model");
                Path modelPath = modelDir.resolve("model.pt");
                Files.copy(is, modelPath, StandardCopyOption.REPLACE_EXISTING);

                Criteria<String, Classifications> criteria = Criteria.builder()
                        .optApplication(Application.NLP.TEXT_CLASSIFICATION)
                        .setTypes(String.class, Classifications.class)
                        .optModelPath(modelDir)
                        .optEngine("PyTorch")
                        .optOption("mapLocation", "true")
                        .optTranslator(translator)
                        .optProgress(new ProgressBar())
                        .build();

                ZooModel<String, Classifications> model = criteria.loadModel();
                this.predictor = model.newPredictor();
                logger.info("Model loaded successfully.");
            }
        } catch (IOException | ModelNotFoundException e) {
            throw new RuntimeException("Failed to load model", e);
        }
    }

    public Classifications classify(String query) throws Exception {
        logger.info("Classifying query: {}", query);
        Classifications classifications = predictor.predict(query);
        logger.info("Classification result: {}", classifications.best());
        return classifications;
    }
}